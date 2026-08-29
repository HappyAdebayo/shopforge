import { vendorApi } from "../axios";
import type { VendorApplyFormData, VendorApplication } from "@/types";

export interface ApplicationsResponse {
  message: string;
  data: {
    applications: VendorApplication[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export const vendorService = {
  async apply(data: VendorApplyFormData) {
    const res = await vendorApi.post("/api/vendors/apply", data);
    return res.data as {
      message: string;
      data: { application: VendorApplication };
    };
  },

  async getApplications(page = 1, limit = 50): Promise<ApplicationsResponse> {
    const res = await vendorApi.get<ApplicationsResponse>(
      `/api/vendors/applications?page=${page}&limit=${limit}`
    );
    return res.data;
  },

  async approveApplication(id: number) {
    const res = await vendorApi.patch(`/api/vendors/applications/${id}/approve`);
    return res.data;
  },

  async rejectApplication(id: number) {
    const res = await vendorApi.patch(`/api/vendors/applications/${id}/reject`);
    return res.data;
  },

  async getVendorById(id: number) {
    const res = await vendorApi.get(`/api/vendors/${id}`);
    return res.data?.data;
  },

  async getVendorByUserId(userId: number) {
    const res = await vendorApi.get(`/api/vendors/user/${userId}`);
    return res.data?.data;
  },
};

