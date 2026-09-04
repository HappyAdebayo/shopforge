"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CreditCard,
  Building2,
  Phone,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { paymentService } from "@/lib/api/payment";
import { orderService } from "@/lib/api/order";
import { cartService } from "@/lib/api/cart";
import { useAuth } from "@/hooks/useAuth";
import { useGuestCart } from "@/hooks/useGuestCart";

function PaystackMockContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { clearCart: clearGuestCart, refreshServerCount } = useGuestCart();

  const reference = searchParams.get("reference") || "";
  const amount = searchParams.get("amount") || "0.00";

  const [channel, setChannel] = useState<"card" | "bank" | "ussd">("card");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form states
  const [cardNumber, setCardNumber] = useState("4084 0840 8408 4084");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("408");

  const handlePay = async (simulateFailure = false) => {
    if (!reference || processing) return;

    setProcessing(true);
    setError(null);

    try {
      const verifyRes = await paymentService.verify({
        reference: simulateFailure ? `${reference}_fail` : reference,
        provider: "paystack",
      });

      if (verifyRes.status !== "successful") {
        throw new Error("Payment was declined or cancelled.");
      }

      // If payment has orderId, update order status
      const paymentData = verifyRes.payment || (verifyRes as any);
      const orderId = paymentData?.orderId;
      if (orderId) {
        await orderService.updateStatus(
          orderId,
          "confirmed",
          "Payment verified via Paystack Simulator"
        ).catch(() => {});
      }

      // Clear cart
      if (user) {
        try { await cartService.clearCart(); } catch { /* ignore */ }
        await refreshServerCount(0);
      } else {
        clearGuestCart();
      }

      setSuccess(true);
    } catch (err: unknown) {
      let msg = "Payment simulation failed. Please try again.";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) msg = axiosErr.response.data.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
          <p className="text-slate-500 text-xs mb-6">
            Your transaction has been verified and processed successfully.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 text-left text-xs text-slate-600 mb-6 space-y-2 border border-slate-100">
            <div className="flex justify-between">
              <span>Reference</span>
              <span className="font-mono font-bold text-slate-800">{reference}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount Paid</span>
              <span className="font-bold text-slate-900">₦{Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>Channel</span>
              <span className="capitalize font-medium text-slate-800">Paystack ({channel})</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/cart")}
              className="w-full py-3 bg-[#0ba4db] hover:bg-[#0991c2] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
            >
              View Order Details
            </button>
            <Link
              href="/"
              className="w-full py-2.5 text-xs text-slate-600 hover:text-slate-900 font-medium text-center"
            >
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Paystack Header */}
        <div className="bg-[#011b33] text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#0ba4db] flex items-center justify-center font-black text-xs text-white">
                P
              </div>
              <span className="font-extrabold tracking-tight text-sm">paystack</span>
              <span className="text-[10px] bg-amber-400 text-slate-900 font-bold px-1.5 py-0.5 rounded ml-1">
                TEST MODE
              </span>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Lock size={12} /> Secured
            </span>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-[11px] text-slate-400">ShopForge Store Checkout</p>
              <p className="font-mono text-xs text-slate-300 truncate max-w-xs">{reference}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-white">₦{Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Channel selector */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setChannel("card")}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                channel === "card"
                  ? "border-[#0ba4db] bg-[#0ba4db]/10 text-[#0ba4db]"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <CreditCard size={18} />
              <span>Card</span>
            </button>
            <button
              type="button"
              onClick={() => setChannel("bank")}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                channel === "bank"
                  ? "border-[#0ba4db] bg-[#0ba4db]/10 text-[#0ba4db]"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Building2 size={18} />
              <span>Bank</span>
            </button>
            <button
              type="button"
              onClick={() => setChannel("ussd")}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                channel === "ussd"
                  ? "border-[#0ba4db] bg-[#0ba4db]/10 text-[#0ba4db]"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Phone size={18} />
              <span>USSD</span>
            </button>
          </div>

          {/* Form per channel */}
          {channel === "card" && (
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-[#0ba4db]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Expires
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-[#0ba4db]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-[#0ba4db]"
                  />
                </div>
              </div>
            </div>
          )}

          {channel === "bank" && (
            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600 mb-6 space-y-2 border border-slate-200">
              <p className="font-semibold text-slate-800">Simulated Bank Transfer</p>
              <p>Bank: <strong className="text-slate-900">Test Bank PLC</strong></p>
              <p>Account: <strong className="font-mono text-slate-900">0123456789</strong></p>
              <p className="text-[11px] text-slate-400">Click below to simulate completed transfer.</p>
            </div>
          )}

          {channel === "ussd" && (
            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600 mb-6 space-y-2 border border-slate-200">
              <p className="font-semibold text-slate-800">Simulated USSD Code</p>
              <p className="font-mono text-sm font-bold text-slate-900 bg-white p-2 rounded border text-center">
                *737*000*4242#
              </p>
              <p className="text-[11px] text-slate-400 text-center">Click below to simulate USSD authorization.</p>
            </div>
          )}

          {/* Submit */}
          <div className="space-y-2">
            <button
              onClick={() => handlePay(false)}
              disabled={processing}
              className="w-full py-3.5 bg-[#0ba4db] hover:bg-[#0991c2] text-white font-bold text-sm rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? (
                <><Loader2 size={18} className="animate-spin" /> Authorizing Payment...</>
              ) : (
                <>Pay ₦{Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</>
              )}
            </button>

            <button
              onClick={() => handlePay(true)}
              disabled={processing}
              className="w-full py-2 text-xs text-rose-600 hover:text-rose-700 font-medium text-center"
            >
              Simulate Declined Card
            </button>

            <Link
              href="/checkout"
              className="block w-full py-2 text-xs text-slate-500 hover:text-slate-800 text-center font-medium"
            >
              Cancel and Return to Checkout
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-600" /> Paystack Sandbox
          </span>
          <span>Test Reference: {reference.slice(0, 14)}...</span>
        </div>
      </div>
    </div>
  );
}

export default function PaystackMockPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#0ba4db]" />
      </div>
    }>
      <PaystackMockContent />
    </Suspense>
  );
}
