import { productApi } from "../axios";
import type { Product, PaginatedProducts, CreateProductFormData } from "@/types";

export interface GetProductsParams {
  categoryId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export const productService = {
  async getAll(params?: GetProductsParams): Promise<PaginatedProducts> {
    const query = new URLSearchParams();
    if (params?.categoryId) query.append("categoryId", params.categoryId.toString());
    if (params?.search) query.append("search", params.search);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const res = await productApi.get<{
      message: string;
      data: PaginatedProducts;
    }>(`/api/products?${query.toString()}`);
    return res.data.data;
  },

  async getById(id: number | string): Promise<Product> {
    const res = await productApi.get<{
      message: string;
      data: Product;
    }>(`/api/products/${id}`);
    return res.data.data;
  },

  async getMyProducts(params?: { page?: number; limit?: number }): Promise<PaginatedProducts> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const res = await productApi.get<{
      message: string;
      data: PaginatedProducts;
    }>(`/api/products/my-products?${query.toString()}`);
    return res.data.data;
  },

  async getProductCount(): Promise<number> {
    const res = await productApi.get<{
      message: string;
      data: { count: number };
    }>("/api/products/admin/count");
    return res.data.data.count;
  },

  async create(data: CreateProductFormData): Promise<Product> {
    const res = await productApi.post<{
      message: string;
      data: Product;
    }>("/api/products", data);
    return res.data.data;
  },

  async update(id: number | string, data: Partial<CreateProductFormData>): Promise<Product> {
    const res = await productApi.put<{
      message: string;
      data: Product;
    }>(`/api/products/${id}`, data);
    return res.data.data;
  },

  async delete(id: number | string): Promise<Product> {
    const res = await productApi.delete<{
      message: string;
      data: Product;
    }>(`/api/products/${id}`);
    return res.data.data;
  },
};
