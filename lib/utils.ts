import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(error: unknown, defaultMessage = "An error occurred"): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      (Array.isArray(error.response?.data?.errors) && error.response?.data?.errors[0]?.message) ||
      error.message ||
      defaultMessage
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return defaultMessage;
}
export function formatPrice(amount: number | string | undefined | null): string {
  const num = typeof amount === "number" ? amount : Number(amount || 0);
  return `₦${num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
