"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  PackageX,
  Tag,
} from "lucide-react";
import { productService } from "@/lib/api/product";
import type { Product } from "@/types";

export default function VendorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.getMyProducts({ page: 1, limit: 50 });
      setProducts(res?.products ?? []);
    } catch (err: unknown) {
      let msg = "Failed to load your products";
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
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this product?")) return;
    setDeletingId(id);
    try {
      await productService.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSuccessMsg("Product deactivated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      let msg = "Failed to delete product";
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
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            My Store Products
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your inventory, price points, and active listings
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center gap-2 text-sm px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium bg-white shadow-sm transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link
            href="/vendor/products/new"
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm transition-colors"
          >
            <Plus size={16} />
            Add New Product
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-sm font-medium flex items-center gap-2 shadow-sm">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2 shadow-sm">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Product List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading your store listings...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3 shadow-sm">
          <PackageX size={44} strokeWidth={1.5} className="mx-auto text-slate-300" />
          <h3 className="font-semibold text-slate-700">No products listed yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You have not added any products to your store yet. Click below to add your first item.
          </p>
          <Link
            href="/vendor/products/new"
            className="inline-flex items-center gap-2 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm mt-2"
          >
            <Plus size={14} /> Add Product Now
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {products.map((product) => {
            const primaryImg =
              product.images?.find((i) => i.isPrimary)?.imageUrl ||
              product.images?.[0]?.imageUrl;

            return (
              <div
                key={product.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                    {primaryImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={primaryImg}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Package size={20} />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-slate-800 text-sm truncate">
                        {product.name}
                      </h4>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                        ID #{product.id}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {product.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 flex-wrap">
                      <span className="font-bold text-amber-600">
                        ₦{Number(product.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Tag size={12} /> Stock:{" "}
                        <strong className="text-slate-700">{product.stock}</strong>
                      </span>
                      <span>·</span>
                      <span
                        className={`font-semibold ${
                          product.stock > 0 ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {product.stock > 0 ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    href={`/user/products/${product.id}`}
                    target="_blank"
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="View live product"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
                    title="Deactivate product"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === product.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
