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
import type { User, LoginFormData, SignupFormData } from "@/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginFormData) => Promise<void>;
  signup: (data: SignupFormData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedUser = tokenStorage.getUser<User>();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    async (data: LoginFormData) => {
      const res = await authService.login(data);
      setUser(res.user);
      // Redirect based on role
      if (res.user.role === "admin") {
        router.push("/admin");
      } else if (res.user.vendorStatus === "approved") {
        router.push("/vendor");
      } else {
        router.push("/user");
      }
    },
    [router]
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
    router.push("/login");
  }, [router]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    tokenStorage.setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
