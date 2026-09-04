"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Product } from "@/types";
import { cartService } from "@/lib/api/cart";
import { useAuth } from "./useAuth";

const STORAGE_KEY = "shopforge_guest_cart";

export interface GuestCartItem {
  productId: number;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  stock: number;
}

interface GuestCartContextType {
  items: GuestCartItem[];
  itemCount: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, quantity: number) => void;
  clearCart: () => void;
  /** Call after every server-side cart mutation to keep the navbar badge in sync. Accepts an optional count for instant update. */
  refreshServerCount: (newCount?: number) => Promise<void>;
}

const GuestCartContext = createContext<GuestCartContextType | null>(null);

export function GuestCartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<GuestCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [serverCartCount, setServerCartCount] = useState(0);

  // Hydrate from localStorage once on mount (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupt data
    }
    setHydrated(true);
  }, []);

  // Fetch server cart count on mount when user is logged in
  const refreshServerCount = useCallback(async (newCount?: number) => {
    if (typeof newCount === "number") {
      setServerCartCount(newCount);
      return;
    }
    try {
      const subtotal = await cartService.getSubtotal();
      setServerCartCount(subtotal?.itemCount ?? 0);
    } catch {
      // Non-fatal — server might be down or token expired
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshServerCount();
    } else {
      setServerCartCount(0);
    }
  }, [user, refreshServerCount]);

  // Persist to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }, [items, hydrated]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    const primaryImg =
      product.images?.find((img) => img.isPrimary)?.imageUrl ??
      product.images?.[0]?.imageUrl;

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const newQty = Math.min(
          existing.quantity + quantity,
          product.stock ?? 99
        );
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: newQty } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          imageUrl: primaryImg,
          quantity: Math.min(quantity, product.stock ?? 99),
          stock: product.stock ?? 99,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQty = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.min(quantity, i.stock) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setServerCartCount(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // For logged-in users show the server count; for guests use local state
  const itemCount = user ? serverCartCount : items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <GuestCartContext.Provider
      value={{ items, itemCount, addItem, removeItem, updateQty, clearCart, refreshServerCount }}
    >
      {children}
    </GuestCartContext.Provider>
  );
}

export function useGuestCart() {
  const ctx = useContext(GuestCartContext);
  if (!ctx) throw new Error("useGuestCart must be used within GuestCartProvider");
  return ctx;
}

