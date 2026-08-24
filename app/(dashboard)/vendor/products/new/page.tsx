"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  PackagePlus,
  Image as ImageIcon,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { productService } from "@/lib/api/product";
import { categoryService } from "@/lib/api/category";
import { useAuth } from "@/hooks/useAuth";
import type { Category } from "@/types";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(150),
  categoryId: z.string().min(1, "Please select a valid category"),
  description: z
    .string()
    .trim()
    .min(5, "Description must be at least 5 characters")
    .max(2000),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Price must be greater than 0"),
  stock: z
    .string()
    .min(1, "Stock is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "Stock must be 0 or greater"),
  primaryIndex: z.string(),
  images: z
    .array(
      z.object({
        imageUrl: z.string().url("Must be a valid image URL"),
      })
    )
    .min(1, "Please provide at least one product image"),
});

type FormInput = z.infer<typeof schema>;

export default function NewProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      categoryId: "",
      description: "",
      price: "",
      stock: "10",
      primaryIndex: "0",
      images: [{ imageUrl: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "images",
  });

  const selectedPrimary = watch("primaryIndex");

  useEffect(() => {
    categoryService
      .getAll()
      .then((cats) => setCategories(cats || []))
      .catch((err) => console.error("Could not load categories:", err))
      .finally(() => setLoadingCats(false));
  }, []);

  const onSubmit = async (data: FormInput) => {
    setServerError(null);
    try {
      const primaryIdx = Number(data.primaryIndex) || 0;
      const payload = {
        vendorId: user?.id ?? 1,
        categoryId: Number(data.categoryId),
        name: data.name,
        description: data.description,
        price: Number(data.price),
        stock: Number(data.stock),
        images: data.images.map((img, idx) => ({
          imageUrl: img.imageUrl,
          isPrimary: idx === primaryIdx,
        })),
      };

      await productService.create(payload);
      setSuccess(true);
      setTimeout(() => {
        router.push("/vendor/products");
      }, 1500);
    } catch (err: unknown) {
      let msg = "Failed to create product";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setServerError(msg);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push("/vendor/products")}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-amber-600 font-medium py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to my products
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <PackagePlus size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Add New Product</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Fill in product specifications, pricing, and upload image links
            </p>
          </div>
        </div>

        {/* Success toast */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 text-sm font-medium flex items-center gap-2 mb-6">
            <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
            Product published successfully! Redirecting to your inventory...
          </div>
        )}

        {/* Error notification */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm flex items-center gap-2 mb-6">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Product Title *
            </label>
            <input
              {...register("name")}
              placeholder="e.g. Wireless Noise-Cancelling Headphones"
              className={`w-full px-4 py-2.5 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errors.name ? "border-red-400 bg-red-50" : "border-slate-300"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Category & Price & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category *
              </label>
              <select
                {...register("categoryId")}
                disabled={loadingCats}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.categoryId
                    ? "border-red-400 bg-red-50"
                    : "border-slate-300"
                }`}
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Price ($ USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register("price")}
                placeholder="49.99"
                className={`w-full px-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.price ? "border-red-400 bg-red-50" : "border-slate-300"
                }`}
              />
              {errors.price && (
                <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>
              )}
            </div>

            {/* Stock */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Available Stock *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                {...register("stock")}
                placeholder="25"
                className={`w-full px-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.stock ? "border-red-400 bg-red-50" : "border-slate-300"
                }`}
              />
              {errors.stock && (
                <p className="mt-1 text-xs text-red-600">{errors.stock.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Detailed Description *
            </label>
            <textarea
              {...register("description")}
              rows={4}
              placeholder="Highlight key features, specifications, materials, warranty info..."
              className={`w-full px-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none ${
                errors.description
                  ? "border-red-400 bg-red-50"
                  : "border-slate-300"
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Images Array */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Product Images (1-10 URLs) *
                </label>
                <p className="text-[11px] text-slate-400">
                  Select the radio button next to the image you want as the primary cover photo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => append({ imageUrl: "" })}
                disabled={fields.length >= 10}
                className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus size={14} /> Add Image
              </button>
            </div>

            <div className="space-y-2.5">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-3">
                  {/* Primary Radio */}
                  <label
                    title="Set as primary image"
                    className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer flex-shrink-0"
                  >
                    <input
                      type="radio"
                      value={idx.toString()}
                      {...register("primaryIndex")}
                      className="text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="hidden sm:inline">
                      {selectedPrimary === idx.toString() ? "Primary" : "Cover"}
                    </span>
                  </label>

                  {/* URL Input */}
                  <div className="relative flex-1">
                    <ImageIcon
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      {...register(`images.${idx}.imageUrl` as const)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Remove image button */}
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {errors.images && (
              <p className="text-xs text-red-600">{errors.images.message}</p>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.push("/vendor/products")}
              className="px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="flex items-center gap-2 px-6 py-2.5 text-sm bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-medium rounded-xl shadow-sm transition-all shadow-amber-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating Listing...
                </>
              ) : (
                <>
                  <PackagePlus size={16} />
                  Publish Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
