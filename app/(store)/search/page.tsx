"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ShoppingCart,
  Search,
  Star,
  Package,
  Check,
  ChevronDown,
  Filter,
  X,
  Sparkles,
} from "lucide-react";
import { publicProductService } from "@/lib/api/product";
import { publicCategoryService } from "@/lib/api/category";
import { cartService } from "@/lib/api/cart";
import { useAuth } from "@/hooks/useAuth";
import { useGuestCart } from "@/hooks/useGuestCart";
import type { Product, Category } from "@/types";

/* ─── Amazon Product Card in Search Results ──────────────────────────── */
function SearchProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { addItem, refreshServerCount } = useGuestCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const primaryImg =
    product.images?.find((i) => i.isPrimary)?.imageUrl ??
    product.images?.[0]?.imageUrl;

  const price = Number(product.price);
  const inStock = product.stock > 0;

  // Derive a realistic rating and review count from product id
  const rating = 4.0 + ((product.id * 7) % 10) / 10;
  const reviewsCount = 20 + ((product.id * 37) % 400);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || adding) return;

    setAdding(true);
    try {
      if (user) {
        const cart = await cartService.addItem(product.id, 1);
        await refreshServerCount(cart.itemCount);
      } else {
        addItem(product, 1);
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      /* silently fail */
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-lg transition-shadow duration-200 flex flex-col h-full group">
      {/* Product Image */}
      <Link
        href={`/products/${product.id}`}
        className="relative aspect-square w-full bg-[#f8f9fa] rounded-md overflow-hidden mb-3 block"
      >
        {primaryImg ? (
          <Image
            src={primaryImg}
            alt={product.name}
            fill
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <Package size={48} />
          </div>
        )}

        {!inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-slate-800 text-white text-xs font-bold px-2.5 py-1 rounded">
              Currently Unavailable
            </span>
          </div>
        )}
      </Link>

      {/* Category */}
      <p className="text-[11px] text-slate-500 font-medium truncate uppercase tracking-wider mb-1">
        {product.category?.name ?? "General"}
      </p>

      {/* Title */}
      <Link
        href={`/products/${product.id}`}
        className="text-sm font-medium text-slate-900 line-clamp-2 hover:text-[#c45500] leading-snug mb-1.5"
        title={product.name}
      >
        {product.name}
      </Link>

      {/* Ratings */}
      <div className="flex items-center gap-1 mb-2">
        <div className="flex text-[#de7921]">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={13}
              className={
                star <= Math.round(rating)
                  ? "fill-[#de7921] text-[#de7921]"
                  : "text-slate-300 fill-slate-300"
              }
            />
          ))}
        </div>
        <span className="text-xs text-[#007185] hover:underline cursor-pointer">
          {reviewsCount}
        </span>
      </div>

      {/* Price */}
      <div className="mt-auto pt-2">
        <div className="flex items-baseline gap-0.5">
          <span className="text-xs text-slate-900 font-bold">₦</span>
          <span className="text-2xl font-black text-slate-900 leading-none">
            {Math.floor(price).toLocaleString("en-NG")}
          </span>
          <span className="text-xs text-slate-900 font-bold">
            {(price % 1).toFixed(2).substring(1)}
          </span>
        </div>

        {/* Free Delivery / Prime Tag */}
        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
          <span className="text-emerald-700 font-semibold">FREE delivery</span>
          <span className="font-bold text-slate-800">Tomorrow</span>
        </p>

        {/* Stock info */}
        <p className="text-[11px] mt-0.5">
          {inStock ? (
            product.stock <= 5 ? (
              <span className="text-[#b12704] font-medium">
                Only {product.stock} left in stock - order soon.
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">In Stock</span>
            )
          ) : (
            <span className="text-slate-400">Out of Stock</span>
          )}
        </p>

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock || adding}
          className={`w-full mt-3 py-2 px-3 rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
            added
              ? "bg-emerald-600 text-white"
              : inStock
              ? "bg-[#ffd814] hover:bg-[#f7ca00] text-slate-900 border border-[#fcd200]"
              : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200"
          }`}
        >
          <ShoppingCart size={13} />
          {added ? "Added to Cart" : adding ? "Adding…" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

/* ─── Search Results Page Component ──────────────────────────────────── */
function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams?.get("q") || searchParams?.get("search") || "";
  const initialCat = searchParams?.get("category") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCat, setSelectedCat] = useState<string>(initialCat);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [priceBucket, setPriceBucket] = useState<string | null>(null);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | null>(null);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync category param
  useEffect(() => {
    setSelectedCat(searchParams?.get("category") || "");
  }, [searchParams]);

  // Load Categories
  useEffect(() => {
    publicCategoryService.getAll().then(setCategories).catch(() => {});
  }, []);

  // Fetch Products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await publicProductService.getAll({
        categoryId: selectedCat ? Number(selectedCat) : undefined,
        search: query.trim() || undefined,
        page: 1,
        limit: 100,
      });
      setProducts(res?.products ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCat, query]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Handle Price Bucket Click
  const handlePriceBucket = (bucket: string, min: number | null, max: number | null) => {
    if (priceBucket === bucket) {
      setPriceBucket(null);
      setAppliedMinPrice(null);
      setAppliedMaxPrice(null);
    } else {
      setPriceBucket(bucket);
      setAppliedMinPrice(min);
      setAppliedMaxPrice(max);
      setCustomMin("");
      setCustomMax("");
    }
  };

  // Custom Price Go
  const handleCustomPriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const min = customMin ? Number(customMin) : null;
    const max = customMax ? Number(customMax) : null;
    setPriceBucket("custom");
    setAppliedMinPrice(min);
    setAppliedMaxPrice(max);
  };

  // Clear All Filters
  const handleClearFilters = () => {
    setSelectedCat("");
    setMinRating(null);
    setPriceBucket(null);
    setAppliedMinPrice(null);
    setAppliedMaxPrice(null);
    setCustomMin("");
    setCustomMax("");
    setInStockOnly(false);
    setSortBy("featured");

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`/search?${params.toString()}`);
  };

  const isAnyFilterActive =
    !!selectedCat ||
    minRating !== null ||
    appliedMinPrice !== null ||
    appliedMaxPrice !== null ||
    inStockOnly;

  // Filter & Sort Products in memory
  const filteredProducts = products.filter((p) => {
    // In Stock filter
    if (inStockOnly && p.stock <= 0) return false;

    // Price filter
    const price = Number(p.price);
    if (appliedMinPrice !== null && price < appliedMinPrice) return false;
    if (appliedMaxPrice !== null && price > appliedMaxPrice) return false;

    // Rating filter (simulated)
    if (minRating !== null) {
      const pRating = 4.0 + ((p.id * 7) % 10) / 10;
      if (pRating < minRating) return false;
    }

    return true;
  });

  // Sort Products
  filteredProducts.sort((a, b) => {
    const priceA = Number(a.price);
    const priceB = Number(b.price);
    if (sortBy === "price_asc") return priceA - priceB;
    if (sortBy === "price_desc") return priceB - priceA;
    if (sortBy === "rating") {
      const ratingA = 4.0 + ((a.id * 7) % 10) / 10;
      const ratingB = 4.0 + ((b.id * 7) % 10) / 10;
      return ratingB - ratingA;
    }
    if (sortBy === "newest") return b.id - a.id;
    return 0; // featured default
  });

  const activeCategoryName = categories.find(
    (c) => c.id.toString() === selectedCat
  )?.name;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Top Status Bar (Amazon Search Results Header) */}
      <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="text-sm text-slate-700">
          <span className="font-semibold text-slate-900">
            {filteredProducts.length} results
          </span>
          {query && (
            <span>
              {" "}
              for <span className="font-bold text-[#c45500]">&quot;{query}&quot;</span>
            </span>
          )}
          {activeCategoryName && (
            <span>
              {" "}
              in <span className="font-semibold text-slate-900">{activeCategoryName}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded border border-slate-300"
          >
            <Filter size={13} /> Filters
          </button>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Sort by:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#f0f2f2] hover:bg-[#e3e6e6] border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none cursor-pointer appearance-none pr-7 shadow-sm"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Avg. Customer Review</option>
                <option value="newest">Newest Arrivals</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Filter Sidebar + Product Grid */}
      <div className="flex gap-6 items-start">
        {/* Amazon Left Sidebar Filters */}
        <aside
          className={`fixed inset-0 z-50 bg-white p-6 overflow-y-auto lg:static lg:z-auto lg:p-0 lg:overflow-visible lg:w-60 lg:shrink-0 lg:block ${
            mobileFilterOpen ? "block" : "hidden"
          }`}
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 lg:hidden">
            <h2 className="font-bold text-base text-slate-900">Filters</h2>
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="p-1 rounded text-slate-500 hover:text-slate-900"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6 text-xs text-slate-700 bg-white lg:p-4 lg:rounded-lg lg:border lg:border-slate-200 lg:shadow-sm">
            {/* Clear all filters */}
            {isAnyFilterActive && (
              <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-900">Active Filters</span>
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-[#007185] hover:underline font-semibold"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Department / Categories */}
            <div>
              <h3 className="font-bold text-sm text-slate-900 mb-2">Department</h3>
              <ul className="space-y-1.5">
                <li>
                  <button
                    onClick={() => {
                      setSelectedCat("");
                      const p = new URLSearchParams(searchParams?.toString() || "");
                      p.delete("category");
                      router.push(`/search?${p.toString()}`);
                    }}
                    className={`hover:text-[#c45500] text-left w-full ${
                      !selectedCat ? "font-bold text-slate-900" : "text-slate-600"
                    }`}
                  >
                    All Departments
                  </button>
                </li>
                {categories.map((cat) => {
                  const isSelected = selectedCat === cat.id.toString();
                  return (
                    <li key={cat.id}>
                      <button
                        onClick={() => {
                          setSelectedCat(cat.id.toString());
                          const p = new URLSearchParams(
                            searchParams?.toString() || ""
                          );
                          p.set("category", cat.id.toString());
                          router.push(`/search?${p.toString()}`);
                        }}
                        className={`hover:text-[#c45500] text-left w-full truncate ${
                          isSelected
                            ? "font-bold text-[#c45500]"
                            : "text-slate-600"
                        }`}
                      >
                        {cat.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Customer Reviews */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-bold text-sm text-slate-900 mb-2">
                Customer Reviews
              </h3>
              <div className="space-y-2">
                {[4, 3, 2, 1].map((stars) => {
                  const active = minRating === stars;
                  return (
                    <button
                      key={stars}
                      onClick={() => setMinRating(active ? null : stars)}
                      className={`flex items-center gap-1.5 w-full text-left hover:text-[#c45500] ${
                        active ? "font-bold text-slate-900" : "text-slate-700"
                      }`}
                    >
                      <div className="flex text-[#de7921]">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={
                              s <= stars
                                ? "fill-[#de7921] text-[#de7921]"
                                : "text-slate-300 fill-slate-300"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-xs">&amp; Up</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-bold text-sm text-slate-900 mb-2">Price</h3>
              <div className="space-y-1.5">
                {[
                  { label: "Under ₦5,000", id: "under-5k", min: null, max: 5000 },
                  { label: "₦5,000 to ₦20,000", id: "5k-20k", min: 5000, max: 20000 },
                  { label: "₦20,000 to ₦50,000", id: "20k-50k", min: 20000, max: 50000 },
                  { label: "₦50,000 to ₦100,000", id: "50k-100k", min: 50000, max: 100000 },
                  { label: "₦100,000 & Above", id: "above-100k", min: 100000, max: null },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => handlePriceBucket(tier.id, tier.min, tier.max)}
                    className={`block w-full text-left hover:text-[#c45500] ${
                      priceBucket === tier.id
                        ? "font-bold text-[#c45500]"
                        : "text-slate-600"
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>

              {/* Custom Price Form */}
              <form onSubmit={handleCustomPriceSubmit} className="mt-3 flex items-center gap-1.5">
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    ₦
                  </span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={customMin}
                    onChange={(e) => setCustomMin(e.target.value)}
                    className="w-full pl-5 pr-1 py-1 text-xs border border-slate-300 rounded outline-none focus:border-[#f3a847]"
                  />
                </div>
                <span className="text-slate-400">-</span>
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    ₦
                  </span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={customMax}
                    onChange={(e) => setCustomMax(e.target.value)}
                    className="w-full pl-5 pr-1 py-1 text-xs border border-slate-300 rounded outline-none focus:border-[#f3a847]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-2.5 py-1 text-xs bg-[#f0f2f2] hover:bg-[#e3e6e6] border border-slate-300 rounded font-semibold text-slate-800 shadow-sm"
                >
                  Go
                </button>
              </form>
            </div>

            {/* Availability */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-bold text-sm text-slate-900 mb-2">
                Availability
              </h3>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-[#c45500]">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-400 border-slate-300"
                />
                <span>Include Out of Stock</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Product Results Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse space-y-3"
                >
                  <div className="aspect-square bg-slate-200 rounded" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-6 bg-slate-200 rounded w-1/4 mt-2" />
                  <div className="h-8 bg-slate-200 rounded-full mt-4" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-600">
              <Search size={44} className="mx-auto mb-3 text-slate-300" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                No products found
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                We couldn&apos;t find any products matching your search criteria. Try checking your spelling or adjusting your filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="bg-[#febd69] hover:bg-[#f3a847] text-slate-900 font-bold px-6 py-2 rounded-lg text-xs transition-colors shadow-sm"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <SearchProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading search results...</p>
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
