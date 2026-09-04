import { productApi, publicProductApi } from "../axios";

export interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  userEmail?: string;
  rating: number;
  title?: string;
  comment: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ReviewsResponse {
  reviews: Review[];
  stats: ReviewStats;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface CreateReviewPayload {
  rating: number;
  title?: string;
  comment: string;
}

export const reviewService = {
  async getProductReviews(productId: number | string, page = 1, limit = 10): Promise<ReviewsResponse> {
    const res = await publicProductApi.get<{
      message: string;
      data: ReviewsResponse;
    }>(`/api/products/${productId}/reviews?page=${page}&limit=${limit}`);
    return res.data.data;
  },

  async addReview(productId: number | string, data: CreateReviewPayload): Promise<Review> {
    const res = await productApi.post<{
      message: string;
      data: Review;
    }>(`/api/products/${productId}/reviews`, data);
    return res.data.data;
  },

  async deleteReview(reviewId: number | string): Promise<{ success: boolean }> {
    const res = await productApi.delete<{
      message: string;
      data: { success: boolean };
    }>(`/api/products/reviews/${reviewId}`);
    return res.data.data;
  },
};
