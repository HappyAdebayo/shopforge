import { authApi } from "../axios";
import { tokenStorage } from "../auth";
import type { AuthResponse, LoginFormData, SignupFormData } from "@/types";

export const authService = {
  async signup(data: SignupFormData) {
    const res = await authApi.post("/api/auth/signup", data);
    return res.data as { message: string; data: { user: AuthResponse["user"] } };
  },

  async login(data: LoginFormData): Promise<AuthResponse> {
    const res = await authApi.post<AuthResponse>("/api/auth/login", data);
    const { token, refreshToken, user } = res.data;
    tokenStorage.setTokens(token, refreshToken);
    tokenStorage.setUser(user);
    return res.data;
  },

  async refresh(refreshToken: string) {
    const res = await authApi.post("/api/auth/refresh", { refreshToken });
    const data = res.data?.data as { token: string; refreshToken: string; user?: AuthResponse["user"] };
    if (data?.token && data?.refreshToken) {
      tokenStorage.setTokens(data.token, data.refreshToken);
      if (data.user) {
        tokenStorage.setUser(data.user);
      }
    }
    return res.data as { data: { token: string; refreshToken: string; user?: AuthResponse["user"] } };
  },

  logout() {
    tokenStorage.clearTokens();
  },
};
