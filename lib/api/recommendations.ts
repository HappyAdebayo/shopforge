import axios from "axios";
import type { Product } from "@/types";

const recApi = axios.create({ baseURL: "" });

export const recommendationService = {
  async getPopular(n = 10, excludeIds: number[] = []): Promise<Product[]> {
    try {
      const params = new URLSearchParams({ n: String(n) });
      if (excludeIds.length) params.append("exclude_ids", excludeIds.join(","));
      const res = await recApi.get(`/api/recommendations/popular?${params}`);
      return (res.data || []) as Product[];
    } catch (error) {
      console.warn("Failed to fetch popular recommendations:", error);
      return [];
    }
  },
  async getSimilar(productId: number | string, n = 8): Promise<Product[]> {
    try {
      const res = await recApi.get(`/api/recommendations/similar/${productId}?n=${n}`);
      return (res.data || []) as Product[];
    } catch (error) {
      console.warn(`Failed to fetch similar recommendations for product ${productId}:`, error);
      return [];
    }
  },
  async getForUser(userId: number | string, n = 10): Promise<Product[]> {
    try {
      const res = await recApi.get(`/api/recommendations/user/${userId}?n=${n}`);
      return (res.data || []) as Product[];
    } catch (error) {
      console.warn(`Failed to fetch user recommendations for user ${userId}:`, error);
      return [];
    }
  },
};
