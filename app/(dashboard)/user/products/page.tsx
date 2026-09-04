"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Tag, RefreshCw, PackageX } from "lucide-react";
import { productService } from "@/lib/api/product";
import { categoryService } from "@/lib/api/category";
import type { Product, Category } from "@/types";

export default function ProductsBrowsePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        limit: 50,
      });
      setProducts(res?.products ?? []);
    } catch (err: unknown) {
      let msg = "Failed to load products";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
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
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 lg:p-8 text-white shadow-sm">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <ShoppingBag size={14} />
            Marketplace Catalog
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Explore Products
          </h1>
          <p className="text-indigo-100 text-sm mt-1.5 leading-relaxed">
            Browse through items from verified vendors across multiple categories. Click on any product to view full specifications and details.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        {/* Refresh button */}
        <button
          onClick={() => fetchProducts()}
          disabled={loading}
          className="flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium bg-white shadow-sm transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === null
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
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
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center justify-between">
          <p>{error}</p>
          <button
            onClick={() => fetchProducts()}
            className="text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-9 h-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading products catalog...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 bg-white rounded-2xl border border-slate-200 p-8">
          <PackageX size={48} strokeWidth={1.5} className="text-slate-300" />
          <p className="text-base font-semibold text-slate-700">No products found</p>
          <p className="text-xs text-slate-400 text-center max-w-sm">
            {search || selectedCategory
              ? "Try adjusting your search query or selecting a different category."
              : "No active products are currently available in the marketplace."}
          </p>
          {(search || selectedCategory) && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory(null);
              }}
              className="text-xs text-indigo-600 font-semibold hover:underline mt-1"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((product) => {
            const primaryImg =
              product.images?.find((img) => img.isPrimary)?.imageUrl ||
              product.images?.[0]?.imageUrl;

            return (
              <Link
                key={product.id}
                href={`/user/products/${product.id}`}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col"
              >
                {/* Image Aspect Box */}
                <div className="relative aspect-square bg-slate-100 overflow-hidden">
                  {primaryImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primaryImg}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                      <ShoppingBag size={32} strokeWidth={1.5} />
                      <span className="text-xs">No Image</span>
                    </div>
                  )}
                  <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-800 font-bold text-xs px-2.5 py-1 rounded-lg shadow-sm">
                    ₦{Number(product.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Tag size={12} />
                      Stock: <strong className="text-slate-700">{product.stock}</strong>
                    </span>
                    <span className="text-indigo-600 font-medium group-hover:translate-x-0.5 transition-transform">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
