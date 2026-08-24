"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FolderPlus,
  Tag,
  Trash2,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { categoryService } from "@/lib/api/category";
import type { Category } from "@/types";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoryService.getAll();
      setCategories(data || []);
    } catch (err: unknown) {
      let msg = "Failed to load categories";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await categoryService.create({
        name: data.name,
        description: data.description || undefined,
      });
      setSuccessMsg(`Category "${data.name}" created successfully!`);
      reset();
      setFormOpen(false);
      fetchCategories();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      let msg = "Failed to create category";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    setActionLoadingId(id);
    try {
      await categoryService.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSuccessMsg("Category removed successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      let msg = "Failed to delete category";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Category Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Organize product catalog categories for vendors and shoppers
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCategories}
            disabled={loading}
            className="flex items-center gap-2 text-sm px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium bg-white shadow-sm transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setFormOpen((o) => !o)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-colors"
          >
            <Plus size={16} />
            {formOpen ? "Close Form" : "New Category"}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-sm font-medium flex items-center gap-2 shadow-sm">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2 shadow-sm">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Create Form Drawer / Card */}
      {formOpen && (
        <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
            <FolderPlus size={20} className="text-indigo-600" />
            <h3>Create New Category</h3>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category Name *
              </label>
              <input
                {...register("name")}
                placeholder="e.g. Electronics, Clothing, Home Decor"
                className={`w-full px-4 py-2.5 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.name ? "border-red-400 bg-red-50" : "border-slate-300"
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                {...register("description")}
                rows={2}
                placeholder="Brief description of product types in this category"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-medium shadow-sm transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <Tag size={40} strokeWidth={1.5} className="mx-auto text-slate-300" />
          <h3 className="font-semibold text-slate-700">No categories found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create your first category so vendors can classify and list their products.
          </p>
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl transition-colors shadow-sm mt-2"
          >
            <Plus size={14} /> Add First Category
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold">
                  <Tag size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-800 text-sm">
                      {cat.name}
                    </h4>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                      ID: #{cat.id}
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {cat.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={actionLoadingId === cat.id}
                  title="Delete category"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoadingId === cat.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
