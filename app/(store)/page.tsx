"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Star,
  Package,
  Sparkles,
  ArrowRight,
  Store,
  Tag,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { publicProductService } from "@/lib/api/product";
import { publicCategoryService } from "@/lib/api/category";
import { cartService } from "@/lib/api/cart";
import { recommendationService } from "@/lib/api/recommendations";
import { useAuth } from "@/hooks/useAuth";
import { useGuestCart } from "@/hooks/useGuestCart";
import type { Product, Category, User } from "@/types";
import axios from "axios";

/* ─── Hero Slide Data ────────────────────────────────────────────────── */
const HERO_SLIDES = [
  {
    id: 1,
    badge: "Big Spring Deals",
    title: "Everything you love,\ndelivered with speed.",
    subtitle: "Shop electronics, home goods, fashion, and more from verified sellers.",
    cta: "Explore Today's Deals",
    href: "/search?deal=true",
    bgGradient: "from-[#0f172a] via-[#1e293b] to-[#334155]",
    accentColor: "#febd69",
  },
  {
    id: 2,
    badge: "Seller Spotlight",
    title: "Start Selling\non ShopForge",
    subtitle: "Launch your store in minutes with all-in-one vendor tools and instant checkout.",
    cta: "Become a Seller",
    href: "/become-a-vendor",
    bgGradient: "from-[#111827] via-[#1f2937] to-[#374151]",
    accentColor: "#f59e0b",
  },
  {
    id: 3,
    badge: "Curated Selections",
    title: "Upgrade Your Tech &\nEveryday Essentials",
    subtitle: "Discover high-performance gadgets, accessories, and home upgrades.",
    cta: "Shop Tech Collection",
    href: "/search",
    bgGradient: "from-[#1e1b4b] via-[#312e81] to-[#4338ca]",
    accentColor: "#38bdf8",
  },
];

/* ─── Product Card with View Tracking ─────────────────────────────────── */
function CarouselProductCard({
  product,
  isAdded,
  isAdding,
  onAddToCart,
  user,
}: {
  product: Product;
  isAdded: boolean;
  isAdding: boolean;
  onAddToCart: (e: React.MouseEvent, product: Product) => void;
  user: User | null;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const trackedViewRef = useRef(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || trackedViewRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !trackedViewRef.current) {
            trackedViewRef.current = true;
            if (user?.id) {
              axios
                .post("/api/interactions", {
                  productId: product.id,
                  event: "view",
                  userId: user.id,
                })
                .catch(() => {});
            }
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [product.id, user?.id]);

  const primaryImg =
    product.images?.find((i) => i.isPrimary)?.imageUrl ??
    product.images?.[0]?.imageUrl;
  const price = Number(product.price);
  const inStock = product.stock > 0;

  return (
    <div
      ref={cardRef}
      className="shrink-0 flex flex-col justify-between border border-slate-200/80 rounded-xl p-3 hover:shadow-md hover:border-[#febd69] transition-all bg-white"
      style={{ scrollSnapAlign: "start" }}
    >
      <Link href={`/products/${product.id}`} className="block group/item">
        <div className="relative aspect-square w-full bg-[#f8f9fa] rounded-lg overflow-hidden mb-2">
          {primaryImg ? (
            <Image
              src={primaryImg}
              alt={product.name}
              fill
              className="object-contain p-2 group-hover/item:scale-105 transition-transform duration-300"
              sizes="220px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-300">
              <Package size={36} />
            </div>
          )}
          {/* Deal badge */}
          <div className="absolute top-2 left-2 bg-[#cc0c39] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">
            Deal
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover/item:text-[#c45500] leading-snug mb-1">
          {product.name}
        </p>

        <div className="flex items-center gap-1 mb-1">
          <div className="flex items-center text-[#de7921]">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={11} className="fill-[#de7921]" />
            ))}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">4.8</span>
        </div>

        <div className="flex items-baseline gap-0.5">
          <span className="text-[11px] font-bold text-slate-900">₦</span>
          <span className="text-base sm:text-lg font-black text-slate-900 leading-none">
            {Math.floor(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          </span>
          <span className="text-[11px] font-bold text-slate-900">
            {(price % 1).toFixed(2).substring(1)}
          </span>
        </div>

        <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
          {inStock ? "In Stock" : "Unavailable"}
        </p>
      </Link>

      <button
        onClick={(e) => onAddToCart(e, product)}
        disabled={!inStock || isAdding}
        className={`w-full mt-2 py-1.5 px-2 rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 ${
          isAdded
            ? "bg-emerald-600 text-white"
            : inStock
            ? "bg-[#ffd814] hover:bg-[#f7ca00] text-slate-900 border border-[#fcd200] active:scale-[0.98]"
            : "bg-slate-200 text-slate-400 cursor-not-allowed"
        }`}
      >
        <ShoppingCart size={12} />
        {isAdded ? "Added!" : isAdding ? "…" : "Add to Cart"}
      </button>
    </div>
  );
}

/* ─── Product Carousel Component (Supports 1 or 2 Rows) ─────────────── */
function ProductCarousel({
  title,
  subtitle,
  products,
  seeAllHref,
  rows = 2,
}: {
  title: string;
  subtitle?: string;
  products: Product[];
  seeAllHref?: string;
  rows?: 1 | 2;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { addItem, refreshServerCount } = useGuestCart();
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addedId, setAddedId] = useState<number | null>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0 || addingId === product.id) return;

    setAddingId(product.id);
    try {
      if (user) {
        const cart = await cartService.addItem(product.id, 1);
        await refreshServerCount(cart.itemCount);
        // Track addtocart interaction
        axios
          .post("/api/interactions", {
            productId: product.id,
            event: "addtocart",
            userId: user.id,
          })
          .catch(() => {});
      } else {
        addItem(product, 1);
      }
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 2000);
    } catch {
      /* ignore */
    } finally {
      setAddingId(null);
    }
  };

  if (!products.length) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm relative mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-xs font-semibold text-[#007185] hover:text-[#c45500] hover:underline flex items-center gap-1 shrink-0"
          >
            See more <ChevronRight size={13} />
          </Link>
        )}
      </div>

      {/* Relative container for scroll & buttons */}
      <div className="relative group">
        {/* Left scroll arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-9 h-16 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 rounded-r-md border border-slate-300 shadow-md flex items-center justify-center z-10 transition-all opacity-0 group-hover:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Scrollable grid/flex container */}
        <div
          ref={scrollRef}
          className={
            rows === 2
              ? "grid grid-rows-2 grid-flow-col auto-cols-[190px] sm:auto-cols-[215px] md:auto-cols-[225px] gap-3.5 overflow-x-auto scrollbar-hide py-1 scroll-smooth"
              : "flex gap-4 overflow-x-auto scrollbar-hide py-1 scroll-smooth"
          }
          style={{ scrollSnapType: "x mandatory" }}
        >
          {products.map((product) => (
            <CarouselProductCard
              key={product.id}
              product={product}
              isAdded={addedId === product.id}
              isAdding={addingId === product.id}
              onAddToCart={handleAddToCart}
              user={user}
            />
          ))}
        </div>

        {/* Right scroll arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-9 h-16 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 rounded-l-md border border-slate-300 shadow-md flex items-center justify-center z-10 transition-all opacity-0 group-hover:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}

/* ─── Main Amazon Storefront Page ────────────────────────────────────── */
export default function StoreHomePage() {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [dealsProducts, setDealsProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-advance hero slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cats, prodRes, recs] = await Promise.all([
          publicCategoryService.getAll().catch(() => []),
          publicProductService.getAll({ page: 1, limit: 50 }).catch(() => ({ products: [] })),
          (user?.id
            ? recommendationService.getForUser(user.id, 10)
            : recommendationService.getPopular(10)
          ).catch(() => []),
        ]);

        const prods = prodRes?.products ?? [];
        setCategories(cats);
        setDealsProducts(prods.slice(0, 16));
        setTrendingProducts(prods.slice(4, 20));
        setFeaturedProducts(recs && recs.length > 0 ? recs : prods);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className="min-h-screen">
      {/* ─── 1. Amazon Hero Banner Carousel ──────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div
          className={`relative w-full h-80 sm:h-96 md:h-[420px] bg-gradient-to-r ${slide.bgGradient} text-white transition-all duration-700 flex items-center px-6 sm:px-12 md:px-20`}
        >
          {/* Hero text overlay */}
          <div className="max-w-lg z-10 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <span
              className="inline-block text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3"
              style={{ backgroundColor: slide.accentColor, color: "#0f172a" }}
            >
              {slide.badge}
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-4xl font-extrabold leading-tight tracking-tight mb-3 whitespace-pre-line text-white">
              {slide.title}
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm md:text-base mb-6 max-w-md leading-relaxed">
              {slide.subtitle}
            </p>
            <Link
              href={slide.href}
              className="inline-flex items-center gap-2 font-bold text-xs sm:text-sm px-6 py-3 rounded-lg shadow-md transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: slide.accentColor, color: "#0f172a" }}
            >
              {slide.cta} <ArrowRight size={16} />
            </Link>
          </div>

          {/* Background decorative glowing orbs */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left Arrow */}
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
            }
            className="absolute left-2 top-1/3 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white transition-colors"
            aria-label="Previous Slide"
          >
            <ChevronLeft size={28} />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
            className="absolute right-2 top-1/3 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white transition-colors"
            aria-label="Next Slide"
          >
            <ChevronRight size={28} />
          </button>

          {/* Slide Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {HERO_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentSlide ? "bg-[#febd69] w-6" : "bg-white/40"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Subtle bottom edge blend */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#eaeded] to-transparent pointer-events-none" />
      </div>

      {/* ─── 2. Amazon 4-Card Highlight Grid Below Banner (Unblocked) ─────────── */}
      <div className="max-w-7xl mx-auto px-4 my-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Explore Categories */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3">Shop by Category</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {categories.slice(0, 4).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/search?category=${cat.id}`}
                    className="group block text-center p-2 rounded-lg bg-slate-50 hover:bg-amber-50/50 border border-slate-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-amber-100/60 rounded-full flex items-center justify-center mx-auto mb-1.5 text-amber-700">
                      <Tag size={18} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-amber-800 line-clamp-1">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href="/search"
              className="text-xs font-semibold text-[#007185] hover:text-[#c45500] hover:underline"
            >
              See all departments
            </Link>
          </div>

          {/* Card 2: Sell on ShopForge / Become a Vendor */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mb-2">
                <Store size={13} /> Seller Central
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Sell on ShopForge
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Turn your store into a revenue powerhouse. Reach thousands of buyers across the marketplace.
              </p>
              <div className="space-y-1.5 text-xs text-slate-700 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Verified seller badge</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-indigo-600" />
                  <span>Real-time order tracking</span>
                </div>
              </div>
            </div>
            <Link
              href="/become-a-vendor"
              className="inline-block text-center w-full py-2 px-3 rounded-lg bg-[#febd69] hover:bg-[#f3a847] text-slate-900 font-bold text-xs transition-colors shadow-sm"
            >
              Apply as a Vendor
            </Link>
          </div>

          {/* Card 3: Today's Deals Preview */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900">Today&apos;s Deals</h3>
                <span className="text-[10px] bg-[#cc0c39] text-white font-bold px-2 py-0.5 rounded">
                  Limited Time
                </span>
              </div>
              {dealsProducts[0] ? (
                <Link href={`/products/${dealsProducts[0].id}`} className="block group mb-3">
                  <div className="relative aspect-video w-full bg-[#f8f9fa] rounded-md overflow-hidden mb-2">
                    {dealsProducts[0].images?.[0]?.imageUrl ? (
                      <Image
                        src={dealsProducts[0].images[0].imageUrl}
                        alt={dealsProducts[0].name}
                        fill
                        className="object-contain p-2 group-hover:scale-105 transition-transform"
                        sizes="250px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                        <Package size={32} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-[#c45500]">
                    {dealsProducts[0].name}
                  </p>
                  <p className="text-sm font-black text-[#b12704] mt-0.5">
                    ₦{Number(dealsProducts[0].price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </p>
                </Link>
              ) : (
                <p className="text-xs text-slate-500">Checking current promotions...</p>
              )}
            </div>
            <Link
              href="/search?deal=true"
              className="text-xs font-semibold text-[#007185] hover:text-[#c45500] hover:underline"
            >
              See all deals
            </Link>
          </div>

          {/* Card 4: Top Rated & Verified */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Customer Favorites
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Top rated products with fast fulfillment and verified customer reviews.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg mb-3">
                <div className="flex items-center gap-1 text-[#de7921] mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className="fill-[#de7921] text-[#de7921]" />
                  ))}
                  <span className="text-xs text-slate-600 font-bold ml-1">4.8+</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Over 5,000+ happy purchases completed this month.
                </p>
              </div>
            </div>
            <Link
              href="/search?sort=rating"
              className="text-xs font-semibold text-[#007185] hover:text-[#c45500] hover:underline"
            >
              Explore top rated products
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 3. Amazon Product Carousels ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Carousel 1: Today's Deals */}
        <ProductCarousel
          title="⚡ Today's Deals | Up to 40% Off"
          subtitle="Top discounts and price drops updated every hour"
          products={dealsProducts}
          seeAllHref="/search?deal=true"
        />

        {/* Carousel 2: Best Sellers & Trending */}
        <ProductCarousel
          title="⭐ Best Sellers in All Departments"
          subtitle="Most popular items ordered by shoppers this week"
          products={trendingProducts}
          seeAllHref="/search?sort=bestseller"
        />

        {/* ─── 4. Full-Width "Sell on ShopForge" Banner ─────────────────────── */}
        <div className="bg-[#131921] text-white rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="max-w-xl text-center md:text-left">
            <span className="text-[#febd69] text-xs font-black uppercase tracking-wider">
              Grow Your Business
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-1 mb-2">
              Have products to sell? Join the ShopForge Marketplace.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Create your seller profile, upload your catalog, and reach thousands of registered customers without paying upfront storefront fees.
            </p>
          </div>
          <Link
            href="/become-a-vendor"
            className="shrink-0 bg-[#febd69] hover:bg-[#f3a847] text-slate-900 font-bold text-xs sm:text-sm px-6 py-3 rounded-lg transition-colors shadow-sm"
          >
            Apply to Become a Vendor
          </Link>
        </div>

        {/* Carousel 3: Recommended for You */}
        <ProductCarousel
          title="✨ Recommended Products"
          subtitle="Based on popular browsing trends across the store"
          products={featuredProducts}
          seeAllHref="/search"
        />
      </div>
    </div>
  );
}
