"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Store,
  ShieldCheck,
  Truck,
  RotateCcw,
  Phone,
} from "lucide-react";
import { productService } from "@/lib/api/product";
import { useAuth } from "@/hooks/useAuth";
import { useCall } from "@/hooks/useCall";
import type { Product } from "@/types";

export default function ProductDetailPage() {
  const { user } = useAuth();
  const { startCall } = useCall();
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  // Vendors and admins browse catalogue in view-only mode — no cart or purchase actions
  const isViewOnly = user?.role === "vendor" || user?.role === "admin";

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedNotice, setAddedNotice] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getById(productId);
      setProduct(data);
      const primaryImg =
        data.images?.find((img) => img.isPrimary)?.imageUrl ||
        data.images?.[0]?.imageUrl;
      setSelectedImage(primaryImg || null);
    } catch (err: unknown) {
      let msg = "Failed to load product details";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = () => {
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Product Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">
          {error || "The requested product does not exist or has been removed."}
        </p>
        <button
          onClick={() => router.push("/user/products")}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to Products
        </button>
      </div>
    );
  }

  const inStock = product.stock > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Button */}
      <div>
        <button
          onClick={() => router.push("/user/products")}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 font-medium py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to all products
        </button>
      </div>

      {/* Main Product Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-10">
        {/* Left: Image Gallery (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Display Image */}
          <div className="relative aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
            {selectedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <ShoppingBag size={48} strokeWidth={1.5} />
                <span className="text-sm">No Preview Image</span>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.imageUrl)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === img.imageUrl
                      ? "border-indigo-600 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.imageUrl}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Actions (7 cols) */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Category & Status Tags */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-100">
                <Tag size={12} />
                Category #{product.categoryId}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                  inStock
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                }`}
              >
                {inStock ? (
                  <>
                    <CheckCircle2 size={12} /> In Stock ({product.stock} available)
                  </>
                ) : (
                  <>
                    <AlertTriangle size={12} /> Out of Stock
                  </>
                )}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl lg:text-4xl font-extrabold text-indigo-600">
                ${Number(product.price).toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">Taxes included</span>
            </div>

            {/* Description */}
            <div className="pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Product Description
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Vendor Tag */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <Store size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-400">Sold by</p>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-1.5 py-0.2 rounded">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    Vendor #{product.vendorId}
                  </p>
                </div>
              </div>

              {/* Call Vendor Action Button */}
              <button
                type="button"
                onClick={() => startCall(product.vendorId, `Vendor #${product.vendorId}`)}
                disabled={user?.id === product.vendorId}
                title={user?.id === product.vendorId ? "You cannot call your own store" : "Call Vendor"}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone size={14} />
                <span>Call Vendor</span>
              </button>
            </div>
          </div>

          {/* Action Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            {isViewOnly ? (
              /* View-only notice for vendors and admins */
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Store size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Catalogue View Only</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    You are viewing this as a {user?.role}. Purchase actions are only available to customers.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Added Toast */}
                {addedNotice && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Added {quantity} x &quot;{product.name}&quot; to your cart!
                  </div>
                )}

                {/* Quantity Selector */}
                {inStock && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-600">
                      Quantity:
                    </label>
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-colors font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="px-4 py-1.5 text-sm font-semibold text-slate-800 bg-white min-w-10 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() =>
                          setQuantity((q) => Math.min(product.stock, q + 1))
                        }
                        disabled={quantity >= product.stock}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-colors font-bold text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={!inStock}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium py-3.5 px-6 rounded-xl text-sm transition-all shadow-sm shadow-indigo-200"
                  >
                    <ShoppingBag size={18} />
                    Add to Cart
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={!inStock}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium py-3.5 px-6 rounded-xl text-sm transition-all shadow-sm"
                  >
                    Buy Now
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-slate-400 text-xs">
                  <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50">
                    <Truck size={16} className="text-slate-500" />
                    <span>Fast Shipping</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50">
                    <ShieldCheck size={16} className="text-slate-500" />
                    <span>Secure Checkout</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50">
                    <RotateCcw size={16} className="text-slate-500" />
                    <span>Easy Returns</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
