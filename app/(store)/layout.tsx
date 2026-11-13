"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  Search,
  User,
  LogOut,
  LayoutDashboard,
  MapPin,
  Menu,
  ChevronDown,
  Store,
  PackageCheck,
  ChevronRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGuestCart, GuestCartProvider } from "@/hooks/useGuestCart";
import { publicCategoryService } from "@/lib/api/category";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import type { Category, Product } from "@/types";

function AmazonNavbar() {
  const { user, logout, loading } = useAuth();
  const { itemCount } = useGuestCart();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams?.get("q") || searchParams?.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams?.get("category") || "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // Suppress cart badge until client hydration is complete
  useEffect(() => { setMounted(true); }, []);

  // Debounced product suggestions
  const { suggestions, isLoading: suggestionsLoading, clear: clearSuggestions } =
    useSearchSuggestions(search, { categoryId: selectedCategory, limit: 8 });

  // Open dropdown when we have suggestions or are loading
  useEffect(() => {
    if (search.trim().length >= 2) {
      setDropdownOpen(true);
    } else {
      setDropdownOpen(false);
    }
  }, [search, suggestions]);

  useEffect(() => {
    publicCategoryService.getAll().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setSearch(searchParams?.get("q") || searchParams?.get("search") || "");
    setSelectedCategory(searchParams?.get("category") || "");
  }, [searchParams]);

  // Close account menu and search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = search.trim();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategory) params.set("category", selectedCategory);
    setDropdownOpen(false);
    router.push(`/search?${params.toString()}`);
  };

  const handleSelectSuggestion = useCallback(
    (product: Product) => {
      setSearch(product.name);
      setDropdownOpen(false);
      clearSuggestions();
      router.push(`/products/${product.id}`);
    },
    [router, clearSuggestions]
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  };

  // Group suggestions by category name
  const groupedSuggestions = suggestions.reduce<Record<string, Product[]>>((acc, product) => {
    const catName = product.category?.name ?? "Other";
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(product);
    return acc;
  }, {});

  const isAdmin = user?.role === "admin";
  const isVendor = user?.role === "vendor" || user?.vendorStatus === "approved";

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Primary Amazon Dark Header */}
      <div className="bg-[#131921] text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center h-16 gap-2 sm:gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-1.5 p-2 rounded hover:outline hover:outline-1 hover:outline-white shrink-0"
          >
            <div className="w-8 h-8 bg-[#febd69] rounded-md flex items-center justify-center font-black text-slate-900 text-sm shadow-sm">
              SF
            </div>
            <div className="leading-tight">
              <span className="font-black text-lg tracking-tight text-white flex items-center">
                ShopForge
                <span className="text-[#febd69] text-xs ml-0.5">.com</span>
              </span>
            </div>
          </Link>

          {/* Deliver to snippet (Amazon style) */}
          <div className="hidden md:flex items-center gap-1.5 p-2 rounded hover:outline hover:outline-1 hover:outline-white cursor-pointer shrink-0 text-left">
            <MapPin size={16} className="text-white mt-1 shrink-0" />
            <div className="leading-tight">
              <p className="text-[11px] text-slate-300">Deliver to</p>
              <p className="text-xs font-bold text-white">Select Location</p>
            </div>
          </div>

          {/* Amazon Search Bar + Autocomplete */}
          <div className="flex-1 min-w-0 max-w-3xl relative" ref={searchWrapperRef}>
            <form onSubmit={handleSearch}>
              <div className="flex w-full h-10 rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#f3a847] transition-all">
                {/* Category Dropdown */}
                <div className="relative shrink-0 bg-[#f3f3f3] hover:bg-[#e2e2e2] border-r border-slate-300 text-slate-700 transition-colors">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-full pl-2.5 pr-6 text-xs bg-transparent outline-none cursor-pointer appearance-none text-slate-800 font-medium"
                  >
                    <option value="">All</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
                  />
                </div>

                {/* Text Input */}
                <input
                  type="text"
                  placeholder="Search ShopForge"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => search.trim().length >= 2 && setDropdownOpen(true)}
                  autoComplete="off"
                  className="flex-1 px-3 text-sm text-slate-900 bg-white outline-none min-w-0"
                />

                {/* Search Button */}
                <button
                  type="submit"
                  className="bg-[#febd69] hover:bg-[#f3a847] text-slate-900 w-11 flex items-center justify-center shrink-0 transition-colors"
                  title="Search"
                >
                  <Search size={18} strokeWidth={2.5} />
                </button>
              </div>
            </form>

            {/* Autocomplete Dropdown */}
            {dropdownOpen && (suggestionsLoading || suggestions.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-2xl border border-slate-200 z-50 overflow-hidden max-h-[420px] overflow-y-auto">
                {suggestionsLoading && suggestions.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
                    <Loader2 size={16} className="animate-spin text-[#febd69]" />
                    Searching…
                  </div>
                ) : (
                  <>
                    {Object.entries(groupedSuggestions).map(([category, products]) => (
                      <div key={category}>
                        {/* Category Group Header */}
                        <div className="px-3 pt-3 pb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {category}
                          </span>
                        </div>
                        {products.map((product) => {
                          const primaryImg = product.images?.find((i) => i.isPrimary)?.imageUrl
                            ?? product.images?.[0]?.imageUrl;
                          const price =
                            typeof product.price === "number"
                              ? product.price
                              : parseFloat(product.price as string);
                          return (
                            <button
                              key={product.id}
                              type="button"
                              onMouseDown={(e) => {
                                // Use mousedown so it fires before the input blur
                                e.preventDefault();
                                handleSelectSuggestion(product);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#fdf3dc] text-left transition-colors group"
                            >
                              {/* Thumbnail */}
                              <div className="w-10 h-10 rounded bg-slate-100 shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                                {primaryImg ? (
                                  <Image
                                    src={primaryImg}
                                    alt={product.name}
                                    width={40}
                                    height={40}
                                    className="object-contain w-full h-full"
                                  />
                                ) : (
                                  <Search size={14} className="text-slate-300" />
                                )}
                              </div>

                              {/* Name + Price */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-800 font-medium truncate group-hover:text-[#c45500]">
                                  {product.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {isNaN(price) ? "" : `₦${price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
                                </p>
                              </div>

                              <ChevronRight size={14} className="text-slate-300 group-hover:text-[#f3a847] shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    ))}

                    {/* Footer: see all results */}
                    <div className="border-t border-slate-100">
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const params = new URLSearchParams();
                          if (search.trim()) params.set("q", search.trim());
                          if (selectedCategory) params.set("category", selectedCategory);
                          setDropdownOpen(false);
                          router.push(`/search?${params.toString()}`);
                        }}
                        className="w-full px-4 py-3 text-sm text-center text-[#007185] hover:text-[#c45500] hover:bg-slate-50 font-medium transition-colors"
                      >
                        See all results for &ldquo;<span className="font-bold">{search.trim()}</span>&rdquo;
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Side Options */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Account & Lists */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setAccountMenuOpen((o) => !o)}
                className="flex flex-col items-start p-2 rounded hover:outline hover:outline-1 hover:outline-white text-left leading-tight"
              >
                <span className="text-[11px] text-slate-300 truncate max-w-28">
                  {user ? `Hello, ${user.name.split(" ")[0]}` : "Hello, sign in"}
                </span>
                <span className="text-xs font-bold text-white flex items-center gap-0.5">
                  Account &amp; Lists <ChevronDown size={11} className="text-slate-400" />
                </span>
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-white text-slate-800 rounded-lg shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* If not logged in */}
                  {!user ? (
                    <div className="p-4 text-center border-b border-slate-100 bg-slate-50">
                      <Link
                        href={`/login?redirect=${encodeURIComponent(pathname)}`}
                        onClick={() => setAccountMenuOpen(false)}
                        className="block w-full bg-[#febd69] hover:bg-[#f3a847] text-slate-900 font-bold text-xs py-2 rounded-md transition-colors shadow-sm mb-2"
                      >
                        Sign in
                      </Link>
                      <p className="text-[11px] text-slate-500">
                        New customer?{" "}
                        <Link
                          href="/signup"
                          onClick={() => setAccountMenuOpen(false)}
                          className="text-indigo-600 font-semibold hover:underline"
                        >
                          Start here.
                        </Link>
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                      <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                  )}

                  <div className="p-2 text-xs space-y-0.5">
                    {/* Only show dashboards if authorized */}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-100 font-semibold text-red-700"
                      >
                        <LayoutDashboard size={14} /> Admin Dashboard
                      </Link>
                    )}

                    {isVendor && (
                      <Link
                        href="/vendor"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-100 font-semibold text-amber-700"
                      >
                        <LayoutDashboard size={14} /> Vendor Dashboard
                      </Link>
                    )}

                    {!isVendor && !isAdmin && (
                      <Link
                        href="/become-a-vendor"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-100 font-medium text-slate-700"
                      >
                        <Store size={14} className="text-indigo-600" /> Become a Seller / Vendor
                      </Link>
                    )}

                    <Link
                      href="/cart"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-100 text-slate-700"
                    >
                      <PackageCheck size={14} /> Your Orders &amp; Cart
                    </Link>

                    {user && (
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded text-red-600 hover:bg-red-50 text-left font-medium"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Returns & Orders */}
            <Link
              href="/cart"
              className="hidden sm:flex flex-col items-start p-2 rounded hover:outline hover:outline-1 hover:outline-white text-left leading-tight"
            >
              <span className="text-[11px] text-slate-300">Returns</span>
              <span className="text-xs font-bold text-white">&amp; Orders</span>
            </Link>

            {/* Amazon Shopping Cart */}
            <Link
              href="/cart"
              className="flex items-center gap-1 p-2 rounded hover:outline hover:outline-1 hover:outline-white shrink-0 relative"
            >
              <div className="relative">
                <ShoppingCart size={28} className="text-white" />
                {mounted && itemCount > 0 && (
                  <span className="absolute -top-1 left-3.5 bg-[#febd69] text-slate-900 text-xs font-black rounded-full min-w-5 h-5 px-1 flex items-center justify-center leading-none">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline-block text-xs font-bold text-white mt-2">
                Cart
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary Amazon Sub-Navbar */}
      <div className="bg-[#232f3e] text-white text-xs font-medium">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center h-10 gap-4 overflow-x-auto scrollbar-hide">
          {/* All menu button */}
          <button
            onClick={() => setDrawerOpen((o) => !o)}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:outline hover:outline-1 hover:outline-white font-bold shrink-0"
          >
            <Menu size={16} /> All
          </button>

          <Link
            href="/search?deal=true"
            className="hover:text-[#febd69] whitespace-nowrap shrink-0 transition-colors"
          >
            Today&apos;s Deals
          </Link>

          <Link
            href="/search?sort=bestseller"
            className="hover:text-[#febd69] whitespace-nowrap shrink-0 transition-colors"
          >
            Best Sellers
          </Link>

          <Link
            href="/search"
            className="hover:text-[#febd69] whitespace-nowrap shrink-0 transition-colors"
          >
            All Products
          </Link>

          {/* Become a Vendor link on top */}
          <Link
            href="/become-a-vendor"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-[#febd69] hover:bg-amber-400/30 whitespace-nowrap shrink-0 font-semibold transition-colors"
          >
            <Store size={13} /> Sell on ShopForge
          </Link>

          {/* Quick Category links */}
          {categories.slice(0, 4).map((cat) => (
            <Link
              key={cat.id}
              href={`/search?category=${cat.id}`}
              className="hidden md:inline-block hover:text-[#febd69] whitespace-nowrap shrink-0 text-slate-300 hover:text-white transition-colors"
            >
              {cat.name}
            </Link>
          ))}

          <div className="ml-auto hidden lg:flex items-center gap-1.5 text-slate-300 text-xs shrink-0">
            <Sparkles size={13} className="text-[#febd69]" />
            <span>Multi-Vendor Marketplace with Direct Delivery</span>
          </div>
        </div>
      </div>

      {/* Slide-out Category Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-80 max-w-full bg-white text-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="bg-[#232f3e] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#febd69] text-slate-900 flex items-center justify-center font-bold text-sm">
                  {user ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                </div>
                <p className="font-bold text-sm">
                  {user ? `Hello, ${user.name}` : "Hello, Sign in"}
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-slate-300 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-5 text-sm">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Shop by Department
                </h3>
                <div className="space-y-1">
                  <Link
                    href="/search"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-between py-2 px-2 rounded hover:bg-slate-100 text-slate-700"
                  >
                    <span>All Products</span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/search?category=${cat.id}`}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center justify-between py-2 px-2 rounded hover:bg-slate-100 text-slate-700"
                    >
                      <span>{cat.name}</span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Programs &amp; Features
                </h3>
                <div className="space-y-1">
                  <Link
                    href="/search?deal=true"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-between py-2 px-2 rounded hover:bg-slate-100 text-slate-700"
                  >
                    <span>Today&apos;s Deals</span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </Link>
                  <Link
                    href="/become-a-vendor"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-between py-2 px-2 rounded hover:bg-slate-100 text-indigo-600 font-semibold"
                  >
                    <span className="flex items-center gap-1.5">
                      <Store size={15} /> Sell on ShopForge
                    </span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>

              {user && (
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Your Account
                  </h3>
                  <div className="space-y-1">
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setDrawerOpen(false)}
                        className="block py-2 px-2 rounded hover:bg-slate-100 text-red-600 font-medium"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    {isVendor && (
                      <Link
                        href="/vendor"
                        onClick={() => setDrawerOpen(false)}
                        className="block py-2 px-2 rounded hover:bg-slate-100 text-amber-600 font-medium"
                      >
                        Vendor Dashboard
                      </Link>
                    )}
                    <Link
                      href="/cart"
                      onClick={() => setDrawerOpen(false)}
                      className="block py-2 px-2 rounded hover:bg-slate-100 text-slate-700"
                    >
                      Your Cart &amp; Orders
                    </Link>
                    <button
                      onClick={() => {
                        setDrawerOpen(false);
                        logout();
                      }}
                      className="w-full text-left py-2 px-2 rounded hover:bg-red-50 text-red-600 font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestCartProvider>
      <div className="min-h-screen bg-[#eaeded] flex flex-col font-sans">
        <Suspense>
          <AmazonNavbar />
        </Suspense>
        <main className="flex-1">{children}</main>
        
        {/* Amazon-style Footer */}
        <footer className="mt-12 bg-[#232f3e] text-white">

          {/* Footer Navigation Columns */}
          <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-xs text-slate-300">
            <div>
              <h4 className="font-bold text-white text-sm mb-3">Get to Know Us</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="hover:underline">About ShopForge</Link></li>
                <li><Link href="/" className="hover:underline">Careers</Link></li>
                <li><Link href="/" className="hover:underline">Press Releases</Link></li>
                <li><Link href="/" className="hover:underline">ShopForge Science</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-3">Make Money with Us</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/become-a-vendor" className="text-[#febd69] font-semibold hover:underline">
                    Sell on ShopForge
                  </Link>
                </li>
                <li><Link href="/become-a-vendor" className="hover:underline">Sell apps on ShopForge</Link></li>
                <li><Link href="/" className="hover:underline">Become an Affiliate</Link></li>
                <li><Link href="/" className="hover:underline">Advertise Your Products</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-3">ShopForge Payment</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="hover:underline">Shop with Points</Link></li>
                <li><Link href="/" className="hover:underline">Reload Your Balance</Link></li>
                <li><Link href="/" className="hover:underline">ShopForge Currency Converter</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-3">Let Us Help You</h4>
              <ul className="space-y-2">
                <li><Link href="/cart" className="hover:underline">Your Orders</Link></li>
                <li><Link href="/" className="hover:underline">Shipping Rates &amp; Policies</Link></li>
                <li><Link href="/" className="hover:underline">Returns &amp; Replacements</Link></li>
                <li><Link href="/" className="hover:underline">Help &amp; Customer Care</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="border-t border-[#3a4553] py-6 text-center text-[11px] text-slate-400">
            <div className="flex items-center justify-center gap-4 mb-2">
              <Link href="/" className="hover:underline">Conditions of Use</Link>
              <Link href="/" className="hover:underline">Privacy Notice</Link>
              <Link href="/become-a-vendor" className="hover:underline">Seller Agreement</Link>
            </div>
            <p>© {new Date().getFullYear()} ShopForge, Inc. or its affiliates. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </GuestCartProvider>
  );
}
