"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Tag,
  RefreshCw,
  PackageX,
  Eye,
  Store,
  Calendar,
  X,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { productService } from "@/lib/api/product";
import { categoryService } from "@/lib/api/category";
import { useAuth } from "@/hooks/useAuth";
import type { Product, Category } from "@/types";

export default function AdminProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") {
      router.push("/user");
    }
  }, [user, authLoading, router]);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await categoryService.getAll();
      setCategories(cats || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.getAll({
        categoryId: selectedCategory ?? undefined,
        search: search.trim() || undefined,
        page: 1,
        limit: 100,
      });
      setProducts(res?.products ?? []);
      setTotalItems(res?.pagination?.totalItems ?? res?.products?.length ?? 0);
    } catch (err: unknown) {
      let msg = "Failed to load products";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) msg = axiosErr.response.data.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search]);

  useEffect(() => {
    if (user?.role === "admin") fetchCategories();
  }, [user, fetchCategories]);

  useEffect(() => {
    if (user?.role === "admin") {
      const timer = setTimeout(() => fetchProducts(), 300);
      return () => clearTimeout(timer);
    }
  }, [user, fetchProducts]);

  if (authLoading || !user) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#131921] border border-slate-800 rounded-3xl p-6 lg:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#febd69]/15 border border-[#febd69]/30 text-[#febd69] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck size={14} />
            Admin Catalog Inspection
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">All Products Overview</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Administrative view of all vendor listings. Inspect stock levels, pricing, category, and vendor details.
          </p>
        </div>
        <div className="bg-[#232f3e] rounded-2xl p-4 border border-slate-700 flex items-center gap-4 self-start md:self-auto shadow-inner">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Listed</p>
            <p className="text-2xl font-black text-[#febd69]">{loading ? "..." : totalItems}</p>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Categories</p>
            <p className="text-2xl font-black text-white">{categories.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#febd69] focus:border-[#febd69] shadow-sm"
          />
        </div>
        <button
          onClick={() => fetchProducts()}
          disabled={loading}
          className="flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium bg-white shadow-sm transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-[#f3a847]" : "text-slate-500"} />
          Refresh
        </button>
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === null
                ? "bg-[#131921] text-[#febd69] border border-[#131921] shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-[#131921] text-[#febd69] border border-[#131921] shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center justify-between shadow-sm">
          <p>{error}</p>
          <button onClick={() => fetchProducts()} className="text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md font-medium">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-9 h-9 border-4 border-[#febd69] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading catalog inventory...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <PackageX size={48} strokeWidth={1.5} className="text-slate-300" />
          <p className="text-base font-semibold text-slate-700">No products found</p>
          <p className="text-xs text-slate-400 text-center max-w-sm">
            {search || selectedCategory
              ? "Try adjusting your filters."
              : "No products have been listed on the platform yet."}
          </p>
          {(search || selectedCategory) && (
            <button
              onClick={() => { setSearch(""); setSelectedCategory(null); }}
              className="text-xs text-[#007185] font-semibold hover:underline mt-1"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#232f3e] text-slate-200 font-semibold text-xs uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => {
                  const primaryImg =
                    product.images?.find((img) => img.isPrimary)?.imageUrl ||
                    product.images?.[0]?.imageUrl;
                  const categoryName =
                    categories.find((c) => c.id === product.categoryId)?.name ||
                    `Category #${product.categoryId}`;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                            {primaryImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={primaryImg} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <ShoppingBag size={18} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-semibold text-slate-800 text-sm truncate">{product.name}</p>
                            <p className="text-xs text-slate-400">ID #{product.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium">
                          <Tag size={12} className="text-slate-400" />
                          {categoryName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-xs text-amber-900 font-semibold bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-md">
                          <Store size={12} className="text-amber-700" />
                          Vendor #{product.vendorId}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        ₦{Number(product.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${product.stock === 0 ? "text-red-500" : product.stock < 10 ? "text-amber-600" : "text-slate-700"}`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${product.stock > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                          {product.stock > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#232f3e] text-[#febd69] hover:bg-[#131921] text-xs font-semibold transition-colors shadow-sm"
                          >
                            <Eye size={14} />
                            Inspect
                          </button>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-1.5 text-slate-400 hover:text-[#007185] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Full detail view"
                          >
                            <ExternalLink size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <div className="flex items-center gap-2">
                <span className="bg-[#131921] text-[#febd69] text-xs font-bold px-2.5 py-1 rounded-lg">ADMIN INSPECT</span>
                <h3 className="font-bold text-slate-900 text-lg">Product Details</h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Images */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Product Images ({selectedProduct.images?.length || 0})
                </p>
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {selectedProduct.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.imageUrl} alt={`preview ${idx + 1}`} className="w-full h-full object-cover" />
                        {img.isPrimary && (
                          <span className="absolute bottom-1.5 left-1.5 bg-[#131921] text-[#febd69] text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-sm">
                    No images uploaded for this product.
                  </div>
                )}
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: "Product ID", value: `#${selectedProduct.id}`, color: "text-slate-800" },
                  { label: "Vendor ID", value: `Vendor #${selectedProduct.vendorId}`, color: "text-amber-800" },
                  {
                    label: "Category",
                    value: categories.find((c) => c.id === selectedProduct.categoryId)?.name || `#${selectedProduct.categoryId}`,
                    color: "text-indigo-700",
                  },
                  { label: "Price", value: `₦${Number(selectedProduct.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`, color: "text-slate-900" },
                  {
                    label: "Stock",
                    value: `${selectedProduct.stock} units`,
                    color: selectedProduct.stock > 0 ? "text-emerald-700" : "text-red-600",
                  },
                  { label: "Status", value: selectedProduct.status || "active", color: "text-slate-800" },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                    <p className={`text-sm font-bold mt-0.5 capitalize ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Name */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Product Name</p>
                <p className="text-base font-bold text-slate-800">{selectedProduct.name}</p>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description</p>
                <p className="text-sm text-slate-600 whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                  {selectedProduct.description || "No description provided."}
                </p>
              </div>

              {/* Timestamps */}
              {(selectedProduct.createdAt || selectedProduct.updatedAt) && (
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
                  {selectedProduct.createdAt && (
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      Created: {new Date(selectedProduct.createdAt).toLocaleDateString()}
                    </span>
                  )}
                  {selectedProduct.updatedAt && (
                    <span>Updated: {new Date(selectedProduct.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Link
                href={`/admin/products/${selectedProduct.id}`}
                className="text-xs text-[#007185] hover:text-[#c45500] font-semibold flex items-center gap-1"
                onClick={() => setSelectedProduct(null)}
              >
                Open Full View <ExternalLink size={13} />
              </Link>
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-[#131921] hover:bg-[#232f3e] text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
