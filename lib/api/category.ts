import { productApi } from "../axios";
import type { Category, CreateCategoryFormData } from "@/types";

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
