import { productApi, publicProductApi } from "../axios";
import type { Category, CreateCategoryFormData } from "@/types";

// Public category service – no auth token; used by storefront
export const publicCategoryService = {
  async getAll(): Promise<Category[]> {
    const res = await publicProductApi.get<{
      message: string;
      data: Category[];
    }>("/api/categories");
    return res.data.data;
  },
};

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const res = await productApi.get<{
      message: string;
      data: Category[];
    }>("/api/categories");
    return res.data.data;
  },

  async getById(id: number | string): Promise<Category> {
    const res = await productApi.get<{
      message: string;
      data: Category;
    }>(`/api/categories/${id}`);
    return res.data.data;
  },

  async create(data: CreateCategoryFormData): Promise<Category> {
    const res = await productApi.post<{
      message: string;
      data: Category;
    }>("/api/categories", data);
    return res.data.data;
  },

  async delete(id: number | string): Promise<Category> {
    const res = await productApi.delete<{
      message: string;
      data: Category;
    }>(`/api/categories/${id}`);
    return res.data.data;
  },
};
