import { callApi } from "../axios";
import type { Call, CallResponse, CallListResponse } from "@/types";

export const callService = {
  async createCall(
    vendorId: number,
    meta?: { callerName?: string; vendorName?: string }
  ): Promise<Call> {
    const res = await callApi.post<CallResponse>("/api/calls", {
      vendorId,
      callerName: meta?.callerName,
      vendorName: meta?.vendorName,
    });
    return res.data.data;
  },

  async getCalls(): Promise<Call[]> {
    const res = await callApi.get<CallListResponse>("/api/calls");
    return res.data.data;
  },

  async getCallById(id: number): Promise<Call> {
    const res = await callApi.get<CallResponse>(`/api/calls/${id}`);
    return res.data.data;
  },

  async acceptCall(id: number): Promise<Call> {
    const res = await callApi.patch<CallResponse>(`/api/calls/${id}/accept`);
    return res.data.data;
  },

  async rejectCall(id: number): Promise<Call> {
    const res = await callApi.patch<CallResponse>(`/api/calls/${id}/reject`);
    return res.data.data;
  },

  async endCall(id: number): Promise<Call> {
    const res = await callApi.patch<CallResponse>(`/api/calls/${id}/end`);
    return res.data.data;
  },
};
