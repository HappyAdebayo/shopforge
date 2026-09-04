"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { tokenStorage } from "@/lib/auth";
import { authService } from "@/lib/api/auth";
import { cartService } from "@/lib/api/cart";
import type { User, LoginFormData, SignupFormData } from "@/types";
import { useRouter } from "next/navigation";

const GUEST_CART_KEY = "shopforge_guest_cart";

interface GuestCartItem {
  productId: number;
  quantity: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginFormData) => Promise<void>;
  signup: (data: SignupFormData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshTokens: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Background token refresh
  const refreshTokens = useCallback(async () => {
    const rfToken = tokenStorage.getRefreshToken();
    if (!rfToken) return;

    try {
      const res = await authService.refresh(rfToken);
      if (res?.data?.user) {
        setUser(res.data.user);
      }
    } catch {
      // Non-fatal if server is unreachable
    }
  }, []);

  // Hydrate from localStorage on mount and run background token refresh
  useEffect(() => {
    const storedUser = tokenStorage.getUser<User>();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);

    // Initial background token refresh on load to sync any role/vendorStatus updates
    refreshTokens();

    // Periodic background token refresh every 10 minutes (access tokens expire in 15m)
    const intervalId = setInterval(() => {
      refreshTokens();
    }, 10 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [refreshTokens]);

  /** Merge guest cart items into the authenticated server cart silently */
  const mergeGuestCart = useCallback(async () => {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      if (!raw) return;
      const guestItems: GuestCartItem[] = JSON.parse(raw);
      if (!guestItems.length) return;

      await Promise.allSettled(
        guestItems.map((item) =>
          cartService.addItem(item.productId, item.quantity)
        )
      );
      localStorage.removeItem(GUEST_CART_KEY);
    } catch {
      // Merge failure is non-fatal
    }
  }, []);

  const login = useCallback(
    async (data: LoginFormData) => {
      const res = await authService.login(data);
      setUser(res.user);

      // Merge any guest cart items into the now-authenticated cart
      await mergeGuestCart();

      // Respect ?redirect= param from the current URL, otherwise go to storefront
      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
      );
      const redirectTo = params.get("redirect") || "/";
      if (res.user.role === "admin") {
        router.push("/admin");
      } else if (res.user.role === "vendor" || res.user.vendorStatus === "approved") {
        router.push("/vendor");
      } else {
        const safeRedirect = redirectTo.startsWith("/user") || redirectTo.startsWith("/dashboard") ? "/" : redirectTo;
        router.push(safeRedirect);
      }
    },
    [router, mergeGuestCart]
  );

  const signup = useCallback(
    async (data: SignupFormData) => {
      await authService.signup(data);
      router.push("/login");
    },
    [router]
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    router.push("/");
  }, [router]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    tokenStorage.setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, refreshTokens }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
