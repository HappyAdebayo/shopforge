"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { paymentService } from "@/lib/api/payment";
import { orderService } from "@/lib/api/order";
import { cartService } from "@/lib/api/cart";
import { useAuth } from "@/hooks/useAuth";
import { useGuestCart } from "@/hooks/useGuestCart";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { clearCart: clearGuestCart, refreshServerCount } = useGuestCart();

  const reference = searchParams.get("reference") || searchParams.get("trxref") || "";
  const orderId = searchParams.get("orderId") || "";
  const provider = searchParams.get("provider") || "paystack";

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setErrorMessage("No payment reference found in callback.");
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        const verifyRes = await paymentService.verify({
          reference,
          provider,
        });

        if (verifyRes.status !== "successful") {
          throw new Error("Payment verification indicated transaction was not successful.");
        }

        const effectiveOrderId = orderId || (verifyRes.payment as any)?.orderId;
        if (effectiveOrderId) {
          await orderService.updateStatus(
            effectiveOrderId,
            "confirmed",
            `Payment verified via ${provider} callback`
          ).catch(() => {});
        }

        if (user) {
          try { await cartService.clearCart(); } catch { /* ignore */ }
          await refreshServerCount(0);
        } else {
          clearGuestCart();
        }

        if (isMounted) setStatus("success");
      } catch (err: unknown) {
        let msg = "Failed to verify transaction.";
        if (err && typeof err === "object" && "response" in err) {
          const axiosErr = err as { response?: { data?: { message?: string } } };
          if (axiosErr.response?.data?.message) msg = axiosErr.response.data.message;
        } else if (err instanceof Error) {
          msg = err.message;
        }
        if (isMounted) {
          setStatus("error");
          setErrorMessage(msg);
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [reference, orderId, provider, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "verifying") {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <Loader2 size={36} className="animate-spin text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-1">Verifying Payment...</h2>
        <p className="text-xs text-slate-500">
          Please wait while we confirm your transaction with {provider}.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Payment Verification Failed</h2>
        <p className="text-xs text-slate-500 mb-6">{errorMessage}</p>
        <Link
          href="/checkout"
          className="inline-block py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
        >
          Return to Checkout
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
        <CheckCircle2 size={36} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Confirmed!</h2>
      <p className="text-xs text-slate-500 mb-6">
        Your order is now confirmed and is being processed.
      </p>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => router.push("/cart")}
          className="w-full py-3 bg-[#febd69] hover:bg-[#f3a847] text-slate-900 font-bold text-xs rounded-xl transition-colors shadow-sm"
        >
          View Orders
        </button>
        <Link
          href="/"
          className="w-full py-2.5 text-xs text-slate-600 hover:text-slate-900 font-medium text-center"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutCallbackPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <Loader2 size={36} className="animate-spin text-amber-500 mx-auto mb-4" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
