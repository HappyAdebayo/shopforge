"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Package,
  Lock,
  ChevronLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGuestCart } from "@/hooks/useGuestCart";
import { cartService, type Cart } from "@/lib/api/cart";
import { orderService, type Order } from "@/lib/api/order";
import { paymentService } from "@/lib/api/payment";

// ─── Step tracking ────────────────────────────────────────────────────────────
type CheckoutStep = "form" | "payment" | "success";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    items: guestItems,
    clearCart: clearGuestCart,
    refreshServerCount,
  } = useGuestCart();

  const [serverCart, setServerCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [step, setStep] = useState<CheckoutStep>("form");

  // Form states
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateProvince, setStateProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [paymentProvider, setPaymentProvider] = useState<"mock" | "stripe" | "paystack">("mock");

  // Payment / order state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Load server cart
  useEffect(() => {
    if (user) {
      if (!name) setName(user.name);
      if (!email) setEmail(user.email);
      setCartLoading(true);
      cartService
        .getCart()
        .then(setServerCart)
        .catch(() => {})
        .finally(() => setCartLoading(false));
    } else {
      setCartLoading(false);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Determine items to checkout
  const checkoutItems = user
    ? serverCart?.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      })) ?? []
    : guestItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      }));

  const subtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = 0;
  const tax = Number((subtotal * 0.05).toFixed(2));
  const totalAmount = Number((subtotal + shippingFee + tax).toFixed(2));

  // ─── Step 1: Create order (pending) + initialize payment ────────────────────
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutItems.length === 0 || submitting) return;

    if (!name.trim()) { setError("Please enter your full name."); return; }
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!address.trim() || !city.trim()) {
      setError("Please fill in your delivery street address and city.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Create order in PENDING state — no payment yet
      const order = await orderService.create({
        items: checkoutItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          imageUrl: item.imageUrl,
        })),
        customerName: name,
        customerEmail: email,
        currency: "NGN",
        shippingFee,
        tax,
        shippingAddress: { address, city, stateProvince, postalCode, phone },
        paymentProvider,
        notes: `ShopForge order via ${paymentProvider} checkout`,
      });

      setCurrentOrder(order);

      // 2. Initialize payment with the payment-service
      const paymentRes = await paymentService.initialize({
        orderId: order.id,
        amount: totalAmount,
        currency: "NGN",
        customerEmail: email,
        provider: paymentProvider,
        callbackUrl: `${window.location.origin}/checkout/callback?orderId=${order.id}&provider=${paymentProvider}`,
      });

      setPaymentRef(paymentRes.reference);

      if (paymentProvider === "mock") {
        // Show mock payment confirmation screen — user must explicitly confirm
        setStep("payment");
      } else {
        // Paystack / Stripe — redirect to real payment gateway
        if (paymentRes.checkoutUrl) {
          window.location.href = paymentRes.checkoutUrl;
        } else {
          throw new Error("Payment gateway did not return a checkout URL. Please try again.");
        }
      }
    } catch (err: unknown) {
      let msg = "Failed to initialize payment. Please try again.";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) msg = axiosErr.response.data.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Step 2 (Mock only): User explicitly confirms the simulated payment ──────
  const handleConfirmMockPayment = async () => {
    if (!currentOrder || !paymentRef || verifying) return;
    setVerifying(true);
    setError(null);

    try {
      // Verify payment with payment-service (mock always returns "successful")
      const verifyRes = await paymentService.verify({
        reference: paymentRef,
        provider: "mock",
      });

      if (verifyRes.status !== "successful") {
        throw new Error("Payment was not successful. Please try again.");
      }

      // Confirm order status → triggers vendor/admin notifications via RabbitMQ
      await orderService.updateStatus(
        currentOrder.id,
        "confirmed",
        "Payment verified via Mock Checkout"
      );

      // Clear cart
      if (user) {
        try { await cartService.clearCart(); } catch { /* ignore */ }
        await refreshServerCount(0);
      } else {
        clearGuestCart();
      }

      setCompletedOrder({ ...currentOrder, status: "confirmed" });
      setStep("success");
    } catch (err: unknown) {
      let msg = "Payment confirmation failed. Please try again.";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) msg = axiosErr.response.data.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleCancelMockPayment = () => {
    // Go back to form — order stays as "pending" (will be cleaned up)
    setStep("form");
    setCurrentOrder(null);
    setPaymentRef(null);
    setError(null);
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (authLoading || cartLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading checkout...</p>
      </div>
    );
  }

  // ─── Success Screen ──────────────────────────────────────────────────────────
  if (step === "success" && completedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-600">
            <CheckCircle2 size={36} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            Thank you for shopping with ShopForge. A confirmation has been sent to{" "}
            <span className="font-semibold text-slate-700">{email}</span>.
          </p>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left mb-8 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-200/60 pb-2.5">
              <span>Order Number:</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {completedOrder.orderNumber || `#${completedOrder.id}`}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-200/60 pb-2.5">
              <span>Payment Status:</span>
              <span className="font-medium text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={13} /> Paid
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-200/60 pb-2.5">
              <span>Estimated Delivery:</span>
              <span className="font-medium text-emerald-700 flex items-center gap-1">
                <Truck size={14} /> 2–4 Business Days
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Total Paid:</span>
              <span className="font-bold text-slate-900 text-base">₦{totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 py-3.5 px-6 rounded-xl font-bold bg-[#febd69] hover:bg-[#f3a847] text-slate-900 text-sm transition-colors shadow-sm text-center"
            >
              Continue Shopping
            </Link>
            <Link
              href="/cart"
              className="flex-1 py-3.5 px-6 rounded-xl font-semibold border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm transition-colors text-center"
            >
              View Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Mock Payment Confirmation Screen ───────────────────────────────────────
  if (step === "payment" && currentOrder) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg">Confirm Your Payment</h2>
              <p className="text-xs text-slate-400">Demo checkout — no real money charged</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Order summary */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Order</span>
              <span className="font-mono font-bold text-slate-800">{currentOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Billing email</span>
              <span className="font-medium text-slate-800 truncate max-w-[180px]">{email}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Items</span>
              <span className="font-medium text-slate-800">
                {checkoutItems.reduce((s, i) => s + i.quantity, 0)} item(s)
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-slate-900 text-sm">
              <span>Total Due</span>
              <span>₦{totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Simulated card */}
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 mb-6 text-white overflow-hidden">
            <div className="absolute top-3 right-4 opacity-10 text-6xl font-black select-none">DEMO</div>
            <div className="flex items-center justify-between mb-6">
              <Smartphone size={20} className="text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Test Mode
              </span>
            </div>
            <p className="font-mono text-sm tracking-widest text-slate-300 mb-1">
              4242 4242 4242 4242
            </p>
            <div className="flex justify-between text-xs text-slate-400 mt-3">
              <span>{name || "Cardholder Name"}</span>
              <span>12/28 · CVV 000</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleConfirmMockPayment}
              disabled={verifying}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-sm transition-colors disabled:opacity-50"
            >
              {verifying ? (
                <><Loader2 size={18} className="animate-spin" /> Processing Payment...</>
              ) : (
                <><CheckCircle2 size={18} /> Pay ₦{totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })} Now</>
              )}
            </button>
            <button
              onClick={handleCancelMockPayment}
              disabled={verifying}
              className="w-full py-2.5 rounded-xl font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm transition-colors disabled:opacity-50"
            >
              ← Change Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Empty cart screen ───────────────────────────────────────────────────────
  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Package size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
        <p className="text-sm text-slate-500 mb-6">Add items to your cart before proceeding to checkout.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 py-3 px-6 rounded-xl font-bold bg-[#febd69] hover:bg-[#f3a847] text-slate-900 text-sm transition-colors shadow-sm"
        >
          <ChevronLeft size={16} /> Browse Products
        </Link>
      </div>
    );
  }

  // ─── Main Checkout Form ──────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb & Security banner */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft size={15} /> Back to Cart
        </Link>
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <Lock size={13} /> 256-Bit SSL Encrypted &amp; Secure Checkout
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Checkout Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleProceedToPayment} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="font-bold text-slate-900 text-base">Shipping &amp; Delivery Address</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name *</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address *</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 000 0000 000"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Street Address *</label>
                  <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Broad Street"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">City *</label>
                  <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lagos"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">State</label>
                    <input type="text" value={stateProvince} onChange={(e) => setStateProvince(e.target.value)} placeholder="Lagos"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Postal Code</label>
                    <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="100001"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="font-bold text-slate-900 text-base">Payment Method</h3>
              </div>

              <div className="space-y-3">
                {/* Mock */}
                <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentProvider === "mock" ? "border-amber-500 bg-amber-50/40" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="paymentProvider" value="mock" checked={paymentProvider === "mock"} onChange={() => setPaymentProvider("mock")} className="accent-amber-500 w-4 h-4" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">Instant Demo Checkout</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Test Mode</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Simulated payment — no real money charged</p>
                    </div>
                  </div>
                  <CreditCard size={20} className="text-slate-400 shrink-0" />
                </label>

                {/* Paystack */}
                <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentProvider === "paystack" ? "border-amber-500 bg-amber-50/40" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="paymentProvider" value="paystack" checked={paymentProvider === "paystack"} onChange={() => setPaymentProvider("paystack")} className="accent-amber-500 w-4 h-4" />
                    <div>
                      <span className="text-sm font-bold text-slate-900">Paystack</span>
                      <p className="text-xs text-slate-500 mt-0.5">Bank Transfer, USSD, Cards — you will be redirected to Paystack</p>
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-slate-400 shrink-0" />
                </label>

                {/* Stripe */}
                <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentProvider === "stripe" ? "border-amber-500 bg-amber-50/40" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="paymentProvider" value="stripe" checked={paymentProvider === "stripe"} onChange={() => setPaymentProvider("stripe")} className="accent-amber-500 w-4 h-4" />
                    <div>
                      <span className="text-sm font-bold text-slate-900">Credit / Debit Card (Stripe)</span>
                      <p className="text-xs text-slate-500 mt-0.5">Visa, Mastercard, Amex — you will be redirected to Stripe</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                    <Lock size={13} /> Secure
                  </div>
                </label>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold bg-[#febd69] hover:bg-[#f3a847] text-slate-900 transition-colors shadow-md text-base disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 size={20} className="animate-spin" /> Preparing Payment...</>
              ) : paymentProvider === "mock" ? (
                <><CreditCard size={18} /> Review &amp; Pay ₦{totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })} <ArrowRight size={18} /></>
              ) : (
                <><ExternalLink size={18} /> Proceed to {paymentProvider === "paystack" ? "Paystack" : "Stripe"} (₦{totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}) <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100">
              Order Summary ({checkoutItems.reduce((s, i) => s + i.quantity, 0)} items)
            </h3>

            {/* Items list */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 divide-y divide-slate-100">
              {checkoutItems.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 pt-3 first:pt-0">
                  <div className="relative w-14 h-14 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Qty: {item.quantity} × ₦{item.price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-900">₦{(item.price * item.quantity).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-medium text-slate-800">₦{subtotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping &amp; Handling:</span>
                <span className="font-medium text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax (5%):</span>
                <span className="font-medium text-slate-800">₦{tax.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span>Order Total:</span>
                <span className="text-lg font-black text-slate-900">₦{totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Truck size={14} className="text-amber-600 shrink-0" />
                <span>Fast, tracked delivery with automatic dispatch</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>ShopForge 100% Buyer Protection Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

