"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Trash2, Package, ArrowRight, Minus, Plus, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGuestCart } from "@/hooks/useGuestCart";
import { cartService, type Cart } from "@/lib/api/cart";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { items: guestItems, itemCount: guestCount, removeItem: removeGuest, updateQty: updateGuest, clearCart: clearGuest, refreshServerCount } = useGuestCart();
  const [serverCart, setServerCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setCartLoading(true);
      cartService.getCart().then(setServerCart).catch(() => {}).finally(() => setCartLoading(false));
    }
  }, [user]);

  const handleRemoveServer = async (itemId: number) => {
    try {
      const updated = await cartService.removeItem(itemId);
      setServerCart(updated);
      await refreshServerCount(updated.itemCount);
    } catch {}
  };

  const handleUpdateServer = async (itemId: number, qty: number) => {
    try {
      const updated = await cartService.updateQuantity(itemId, qty);
      setServerCart(updated);
      await refreshServerCount(updated.itemCount);
    } catch {}
  };

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // Guest cart
  if (!user) {
    const subtotal = guestItems.reduce((s, i) => s + i.price * i.quantity, 0);

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <ShoppingCart size={24} /> Your Cart
        </h1>

        {guestItems.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-slate-600">Your cart is empty</p>
            <Link href="/" className="mt-4 inline-block text-indigo-600 hover:underline text-sm">Continue shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {guestItems.map((item) => (
              <div key={item.productId} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300"><Package size={28} /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm line-clamp-2">{item.name}</p>
                  <p className="text-indigo-600 font-bold mt-1">₦{item.price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shrink-0">
                  <button onClick={() => updateGuest(item.productId, item.quantity - 1)} className="px-2 py-1.5 hover:bg-slate-100"><Minus size={13} /></button>
                  <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => updateGuest(item.productId, item.quantity + 1)} className="px-2 py-1.5 hover:bg-slate-100"><Plus size={13} /></button>
                </div>
                <button onClick={() => removeGuest(item.productId)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between text-sm text-slate-600 mb-2">
                <span>Subtotal ({guestCount} items)</span>
                <span className="font-semibold text-slate-900">₦{subtotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-slate-100 pt-4 mt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
                  <LogIn size={14} className="inline mr-1.5" />
                  Sign in to place your order. Your cart items will be saved automatically.
                </div>
                <button onClick={() => router.push("/login?redirect=/checkout")}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold bg-[#febd69] hover:bg-[#f3a847] text-slate-900 transition-colors shadow-sm">
                  Sign in to Checkout <ArrowRight size={16} />
                </button>
                <Link href="/" className="block text-center text-sm text-slate-500 hover:text-slate-700 mt-3">Continue shopping</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Server cart (logged-in user)
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl"><ShoppingCart size={22} /></div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Shopping Cart</h1>
          <p className="text-xs text-slate-500">{serverCart?.itemCount ?? 0} items in your cart</p>
        </div>
      </div>

      {cartLoading ? (
        <div className="space-y-4">
          {[1,2,3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : !serverCart || serverCart.items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-slate-600">Your cart is empty</p>
          <Link href="/" className="mt-4 inline-block text-indigo-600 hover:underline text-sm">Continue shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {serverCart.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-300"><Package size={28} /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm line-clamp-2">{item.name}</p>
                <p className="text-indigo-600 font-bold mt-1">₦{Number(item.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shrink-0">
                <button onClick={() => handleUpdateServer(item.id, item.quantity - 1)} className="px-2 py-1.5 hover:bg-slate-100"><Minus size={13} /></button>
                <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => handleUpdateServer(item.id, item.quantity + 1)} className="px-2 py-1.5 hover:bg-slate-100"><Plus size={13} /></button>
              </div>
              <button onClick={() => handleRemoveServer(item.id)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Subtotal ({serverCart.itemCount} items)</span>
              <span className="font-semibold text-slate-900">₦{serverCart.subtotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-slate-100 pt-4 mt-4">
              <button onClick={() => router.push("/checkout")}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold bg-[#febd69] hover:bg-[#f3a847] text-slate-900 transition-colors shadow-sm text-base">
                Proceed to Checkout <ArrowRight size={16} />
              </button>
              <Link href="/" className="block text-center text-sm text-slate-500 hover:text-slate-700 mt-3">Continue shopping</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}