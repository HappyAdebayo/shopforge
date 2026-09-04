"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  Tag,
  Store,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  PackageX,
} from "lucide-react";
import { productService } from "@/lib/api/product";
import { categoryService } from "@/lib/api/category";
import { useAuth } from "@/hooks/useAuth";
import type { Product, Category } from "@/types";

export default function AdminProductDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") {
      router.push("/user");
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const [data, cats] = await Promise.all([
        productService.getById(productId),
        categoryService.getAll().catch(() => [] as Category[]),
      ]);
      setProduct(data);
      setCategories(cats || []);
      const primaryImg =
        data.images?.find((img) => img.isPrimary)?.imageUrl ||
        data.images?.[0]?.imageUrl;
      setSelectedImage(primaryImg || null);
    } catch (err: unknown) {
      let msg = "Failed to load product details";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) msg = axiosErr.response.data.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (user?.role === "admin") fetchData();
  }, [user, fetchData]);

  if (authLoading || !user) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3">
        <div className="w-10 h-10 border-4 border-[#febd69] border-t-transparent rounded-full animate-spin" />
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
          {error || "This product does not exist or has been removed."}
        </p>
        <button
          onClick={() => router.push("/admin/products")}
          className="inline-flex items-center gap-2 bg-[#131921] hover:bg-[#232f3e] text-[#febd69] text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to All Products
        </button>
      </div>
    );
  }

  const inStock = product.stock > 0;
  const categoryName =
    categories.find((c) => c.id === product.categoryId)?.name ||
    `Category #${product.categoryId}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/products")}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-[#007185] font-medium py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to all products
        </button>
        <span className="text-xs font-bold bg-[#131921] text-[#febd69] border border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1">
          <ShieldCheck size={12} />
          Admin View - Read Only
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-10">
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
            {selectedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <ShoppingBag size={48} strokeWidth={1.5} />
                <span className="text-sm">No Preview Image</span>
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.imageUrl)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === img.imageUrl
                      ? "border-[#febd69] shadow-sm"
                      : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.imageUrl} alt={`thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  {img.isPrimary && (
                    <span className="absolute bottom-1 left-1 bg-[#131921] text-[#febd69] text-[9px] font-bold px-1 rounded">
                      Main
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-semibold px-3 py-1 rounded-full border border-slate-200">
                <Tag size={12} />
                {categoryName}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${inStock ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                {inStock ? (
                  <><CheckCircle2 size={12} /> In Stock ({product.stock} units)</>
                ) : (
                  <><PackageX size={12} /> Out of Stock</>
                )}
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl lg:text-4xl font-extrabold text-[#b12704]">
                ₦{Number(product.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400">Listed price (admin view)</span>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Product Description
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Store size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Sold by</p>
                  <p className="text-xs font-semibold text-slate-800">Vendor #{product.vendorId}</p>
                </div>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded">
                Verified Vendor
              </span>
            </div>
          </div>

          <div className="bg-[#131921] border border-slate-800 text-white rounded-2xl p-4 space-y-3 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#febd69] flex items-center gap-1.5">
              <ShieldCheck size={13} />
              Admin Metadata
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-[11px] text-slate-400 font-medium">Product ID</p><p className="text-sm font-bold text-white">#{product.id}</p></div>
              <div><p className="text-[11px] text-slate-400 font-medium">Vendor ID</p><p className="text-sm font-bold text-[#febd69]">#{product.vendorId}</p></div>
              <div><p className="text-[11px] text-slate-400 font-medium">Category</p><p className="text-sm font-bold text-slate-200">{categoryName}</p></div>
              <div><p className="text-[11px] text-slate-400 font-medium">Status</p><p className="text-sm font-bold text-white capitalize">{product.status ?? "active"}</p></div>
            </div>
            {(product.createdAt || product.updatedAt) && (
              <div className="pt-2 border-t border-slate-800 flex flex-col gap-1">
                {product.createdAt && (
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} />
                    Created: {new Date(product.createdAt).toLocaleString()}
                  </p>
                )}
                {product.updatedAt && (
                  <p className="text-xs text-slate-400">
                    Last updated: {new Date(product.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}