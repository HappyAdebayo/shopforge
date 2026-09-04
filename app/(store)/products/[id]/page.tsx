"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart, Package, Star, Shield,
  Truck, RotateCcw, ChevronRight, Minus, Plus,
  MessageSquare, ThumbsUp, Trash2, Send, CheckCircle2,
  AlertCircle, Loader2, UserCircle
} from "lucide-react";
import { publicProductService } from "@/lib/api/product";
import { reviewService, type Review, type ReviewStats } from "@/lib/api/review";
import { cartService } from "@/lib/api/cart";
import { useAuth } from "@/hooks/useAuth";
import { useGuestCart } from "@/hooks/useGuestCart";
import type { Product } from "@/types";

function RecommendedCard({ product }: { product: Product }) {
  const primaryImg =
    product.images?.find((i) => i.isPrimary)?.imageUrl ??
    product.images?.[0]?.imageUrl;
  const price = Number(product.price);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group shrink-0 w-44 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-slate-100 transition-all flex flex-col"
    >
      <div className="relative w-full aspect-square bg-slate-100 overflow-hidden">
        {primaryImg ? (
          <Image
            src={primaryImg}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="176px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <Package size={32} />
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-slate-500 line-clamp-2 flex-1 leading-snug mb-2">
          {product.name}
        </p>
        <span className="text-sm font-bold text-slate-900">
          ₦{price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </span>
      </div>
    </Link>
  );
}

export default function ProductDetailPage() {
  const { user } = useAuth();
  const { addItem, refreshServerCount } = useGuestCart();
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Submit review form state
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setLoadingReviews(true);
    try {
      const res = await reviewService.getProductReviews(productId, 1, 20);
      setReviews(res.reviews || []);
      setStats(res.stats || {
        totalReviews: 0,
        averageRating: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    } catch {
      // ignore
    } finally {
      setLoadingReviews(false);
    }
  }, [productId]);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await publicProductService.getById(productId);
      setProduct(data);
      const primary = data.images?.find((i) => i.isPrimary)?.imageUrl ?? data.images?.[0]?.imageUrl ?? null;
      setSelectedImage(primary);

      if (data.categoryId) {
        publicProductService.getRelated(data.categoryId, data.id, 6)
          .then((res) => setRelated(res))
          .catch(() => {});
      }
    } catch {
      setError("Product not found");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [fetchProduct, fetchReviews]);

  const handleAddToCart = async () => {
    if (!product || adding) return;
    setAdding(true);
    try {
      if (user) {
        const cart = await cartService.addItem(product.id, quantity);
        await refreshServerCount(cart.itemCount);
      } else {
        addItem(product, quantity);
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  };

  const handleCheckout = async () => {
    if (!product) return;
    if (!user) {
      router.push(`/login?redirect=/products/${product.id}`);
      return;
    }
    await handleAddToCart();
    router.push("/checkout");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/products/${productId}`);
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError("Please write a comment for your review.");
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);

    try {
      await reviewService.addReview(productId, {
        rating: userRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim()
      });

      setReviewSuccess(true);
      setReviewComment("");
      setReviewTitle("");
      await fetchReviews();
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err: unknown) {
      let msg = "Failed to submit review. Please try again.";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) msg = axiosErr.response.data.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setReviewError(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await reviewService.deleteReview(reviewId);
      await fetchReviews();
    } catch (err: any) {
      alert(err.message || "Failed to delete review");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-slate-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-6 bg-slate-200 rounded w-1/4" />
            <div className="h-24 bg-slate-200 rounded" />
            <div className="h-12 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center">
        <Package size={56} className="mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700 mb-2">Product not found</h2>
        <Link href="/" className="text-indigo-600 hover:underline text-sm">Back to store</Link>
      </div>
    );
  }

  const price = Number(product.price);
  const inStock = product.stock > 0;
  const allImages = product.images ?? [];
  const displayRating = stats.totalReviews > 0 ? stats.averageRating : 4.5;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-8">
        <Link href="/" className="hover:text-slate-800 transition-colors">Home</Link>
        <ChevronRight size={14} />
        {product.category && (
          <>
            <Link href={`/?category=${product.categoryId}`} className="hover:text-slate-800 transition-colors">
              {product.category.name}
            </Link>
            <ChevronRight size={14} />
          </>
        )}
        <span className="text-slate-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Left: Images */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-slate-100 rounded-3xl overflow-hidden shadow-sm">
            {selectedImage ? (
              <Image src={selectedImage} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300"><Package size={72} /></div>
            )}
            {!inStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-white text-slate-700 font-bold px-6 py-2 rounded-full">Out of Stock</span>
              </div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {allImages.map((img) => (
                <button key={img.id ?? img.imageUrl} onClick={() => setSelectedImage(img.imageUrl)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === img.imageUrl ? "border-indigo-500" : "border-slate-200 hover:border-slate-400"}`}>
                  <Image src={img.imageUrl} alt="" width={64} height={64} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="flex flex-col">
          {product.category && (
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-2">
              {product.category.name}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-3">{product.name}</h1>

          {/* Rating overview link */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={15}
                  className={s <= Math.round(displayRating) ? "text-[#de7921] fill-[#de7921]" : "text-slate-300 fill-slate-300"}
                />
              ))}
            </div>
            <a href="#reviews-section" className="text-sm font-semibold text-[#007185] hover:underline">
              {displayRating.toFixed(1)} ({stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"})
            </a>
          </div>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-4xl font-black text-slate-900">
              ₦{price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className={`w-2 h-2 rounded-full ${inStock ? "bg-green-500" : "bg-red-500"}`} />
            <span className={`text-sm font-medium ${inStock ? "text-green-700" : "text-red-600"}`}>
              {inStock ? `${product.stock} in stock` : "Out of stock"}
            </span>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-8">{product.description}</p>

          {inStock && (
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 w-20">Quantity</span>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-slate-100 transition-colors"><Minus size={14} /></button>
                  <span className="px-4 py-2 text-sm font-semibold min-w-[3rem] text-center">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} className="px-3 py-2 hover:bg-slate-100 transition-colors"><Plus size={14} /></button>
                </div>
              </div>

              <button onClick={handleAddToCart} disabled={adding}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all ${added ? "bg-green-500 text-white" : "bg-amber-400 hover:bg-amber-500 text-slate-900"}`}>
                <ShoppingCart size={18} />
                {added ? "Added to Cart!" : adding ? "Adding..." : "Add to Cart"}
              </button>

              <button onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base bg-slate-900 hover:bg-slate-800 text-white transition-colors">
                {user ? "Proceed to Checkout" : "Sign in to Checkout"}
              </button>

              {!user && (
                <p className="text-center text-xs text-slate-500">
                  Browse freely without an account.{" "}
                  <Link href={`/login?redirect=/products/${productId}`} className="text-indigo-600 hover:underline">Sign in</Link>{" "}
                  to checkout and review products.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-6">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Shield size={20} className="text-indigo-500" />
              <span className="text-xs text-slate-500 leading-tight">Verified Vendors</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Truck size={20} className="text-indigo-500" />
              <span className="text-xs text-slate-500 leading-tight">Fast Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <RotateCcw size={20} className="text-indigo-500" />
              <span className="text-xs text-slate-500 leading-tight">Easy Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Customer Reviews & Ratings Section ──────────────────────────────── */}
      <section id="reviews-section" className="border-t border-slate-200 pt-12 mb-16 scroll-mt-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
            <MessageSquare size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Customer Reviews &amp; Ratings</h2>
            <p className="text-xs text-slate-500">Real feedback from verified shoppers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Rating Breakdown summary */}
          <div className="lg:col-span-4 bg-slate-50 rounded-2xl p-6 border border-slate-200/80 h-fit space-y-5">
            <div className="text-center pb-4 border-b border-slate-200">
              <div className="text-5xl font-black text-slate-900 leading-none mb-2">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "0.0"}
              </div>
              <div className="flex justify-center gap-1 mb-1 text-[#de7921]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    className={star <= Math.round(stats.averageRating) ? "fill-[#de7921]" : "text-slate-300 fill-slate-300"}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Based on {stats.totalReviews} customer {stats.totalReviews === 1 ? "rating" : "ratings"}
              </p>
            </div>

            {/* Breakdown bars */}
            <div className="space-y-2 text-xs">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = (stats.distribution as any)?.[stars] || 0;
                const percentage = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="w-10 font-semibold text-slate-700">{stars} star</span>
                    <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-9 text-right text-slate-500">{percentage}%</span>
                  </div>
                );
              })}
            </div>

            {/* Write review callout */}
            <div className="border-t border-slate-200 pt-4 text-center">
              <h3 className="font-bold text-slate-900 text-sm mb-1">Review this product</h3>
              <p className="text-xs text-slate-500 mb-3">Share your thoughts with other customers</p>
              {!user ? (
                <Link
                  href={`/login?redirect=/products/${productId}`}
                  className="block w-full py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs transition-colors"
                >
                  Sign in to write a review
                </Link>
              ) : (
                <a
                  href="#write-review"
                  className="block w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                >
                  Write a Customer Review
                </a>
              )}
            </div>
          </div>

          {/* Right: Review List & Form */}
          <div className="lg:col-span-8 space-y-8">
            {/* Review submission form */}
            {user ? (
              <form
                id="write-review"
                onSubmit={handleSubmitReview}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">Write a Review</h3>
                  <span className="text-xs text-slate-400">Reviewing as {user.name}</span>
                </div>

                {reviewSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>Your review was published successfully!</span>
                  </div>
                )}

                {reviewError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{reviewError}</span>
                  </div>
                )}

                {/* Rating selection stars */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Overall Rating *
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setUserRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          size={24}
                          className={
                            star <= (hoverRating ?? userRating)
                              ? "text-[#de7921] fill-[#de7921]"
                              : "text-slate-300 fill-slate-300"
                          }
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      {userRating === 5 ? "Excellent (5/5)" :
                       userRating === 4 ? "Good (4/5)" :
                       userRating === 3 ? "Average (3/5)" :
                       userRating === 2 ? "Below Average (2/5)" : "Poor (1/5)"}
                    </span>
                  </div>
                </div>

                {/* Headline / Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Add a headline (optional)
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="What's most important to know?"
                    maxLength={150}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Add a written review *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="What did you like or dislike? What did you use this product for?"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold bg-[#febd69] hover:bg-[#f3a847] text-slate-900 text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {submittingReview ? (
                      <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                    ) : (
                      <><Send size={15} /> Submit Review</>
                    )}
                  </button>
                </div>
              </form>
            ) : null}

            {/* List of customer reviews */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-lg">
                Top Reviews ({reviews.length})
              </h3>

              {loadingReviews ? (
                <div className="py-8 text-center">
                  <Loader2 size={24} className="animate-spin text-amber-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
                  <MessageSquare size={36} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700 mb-1">No customer reviews yet</p>
                  <p className="text-xs text-slate-500 mb-4">Be the first to share your experience with this item.</p>
                  {!user && (
                    <Link
                      href={`/login?redirect=/products/${productId}`}
                      className="inline-block py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
                    >
                      Sign In &amp; Write Review
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <UserCircle size={22} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{rev.userName}</p>
                            <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={11} /> Verified Purchase
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">
                            {new Date(rev.createdAt).toLocaleDateString("en-NG", {
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                            })}
                          </span>
                          {(user?.role === "admin" || user?.id === rev.userId) && (
                            <button
                              onClick={() => handleDeleteReview(rev.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                              title="Delete review"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Stars & Title */}
                      <div className="flex items-center gap-2">
                        <div className="flex text-[#de7921]">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              className={s <= rev.rating ? "fill-[#de7921]" : "text-slate-300 fill-slate-300"}
                            />
                          ))}
                        </div>
                        {rev.title && (
                          <h4 className="font-bold text-sm text-slate-900">{rev.title}</h4>
                        )}
                      </div>

                      {/* Comment text */}
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recommended section */}
      {related.length > 0 && (
        <section className="border-t border-slate-200 pt-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">You may also like</h2>
              <p className="text-sm text-slate-500 mt-0.5">More from {product.category?.name ?? "this category"}</p>
            </div>
            <Link href={`/?category=${product.categoryId}`} className="text-sm text-indigo-600 hover:underline font-medium flex items-center gap-1">
              See all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
            {related.map((p) => (
              <RecommendedCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
