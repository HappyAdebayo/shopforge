import axios from "axios";
import { tokenStorage } from "./auth";

// Auth service axios instance — uses Next.js rewrite proxy to avoid CORS
export const authApi = axios.create({
  baseURL: typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3001"),
  headers: { "Content-Type": "application/json" },
});

// Vendor service axios instance — uses Next.js rewrite proxy to avoid CORS
export const vendorApi = axios.create({
  baseURL: typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_VENDOR_API_URL || "http://localhost:3002"),
  headers: { "Content-Type": "application/json" },
});

// Product service axios instance — uses Next.js rewrite proxy to avoid CORS
export const productApi = axios.create({
  baseURL: typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_PRODUCT_API_URL || "http://localhost:3003"),
  headers: { "Content-Type": "application/json" },
});

// Attach Authorization header to vendor requests
vendorApi.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Attach Authorization header to product requests
productApi.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh token on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const setupAuthRefreshInterceptor = (apiInstance: typeof vendorApi) => {
  apiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return apiInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) {
          tokenStorage.clearTokens();
          if (typeof window !== "undefined") window.location.href = "/login";
          return Promise.reject(error);
        }

        try {
          const res = await authApi.post("/api/auth/refresh", { refreshToken });
          const { token, refreshToken: newRefreshToken } = res.data.data;
          tokenStorage.setTokens(token, newRefreshToken);
          vendorApi.defaults.headers.common.Authorization = `Bearer ${token}`;
          productApi.defaults.headers.common.Authorization = `Bearer ${token}`;
          processQueue(null, token);
          return apiInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          tokenStorage.clearTokens();
          if (typeof window !== "undefined") window.location.href = "/login";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

setupAuthRefreshInterceptor(vendorApi);
setupAuthRefreshInterceptor(productApi);
