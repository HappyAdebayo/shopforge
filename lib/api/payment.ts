import { paymentApi } from "../axios";

export interface Payment {
  id: number;
  orderId: number;
  userId: number;
  amount: number;
  currency: string;
  reference: string;
  provider: "mock" | "stripe" | "paystack" | "flutterwave";
  providerTransactionId?: string;
  status: "pending" | "successful" | "failed" | "refunded";
  paymentMethod?: string;
  customerEmail?: string;
  checkoutUrl?: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InitializePaymentPayload {
  orderId: number;
  amount: number;
  currency?: string;
  customerEmail?: string;
  provider?: "mock" | "stripe" | "paystack" | "flutterwave";
  callbackUrl?: string;
  metadata?: any;
}

export interface VerifyPaymentPayload {
  reference: string;
  provider?: string;
  sessionId?: string;
  accessCode?: string;
}

export const paymentService = {
  async initialize(data: InitializePaymentPayload): Promise<{
    paymentId: number;
    orderId: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    checkoutUrl: string;
    accessCode?: string;
  }> {
    const res = await paymentApi.post<{
      message: string;
      data: any;
    }>("/api/payments/initialize", data);
    return res.data.data;
  },

  async verify(payload: VerifyPaymentPayload | string): Promise<{
    payment: Payment;
    status: string;
    transactionId?: string;
    amount?: number;
    currency?: string;
  }> {
    const body = typeof payload === "string" ? { reference: payload } : payload;
    const res = await paymentApi.post<{
      message: string;
      data: any;
    }>("/api/payments/verify", body);
    return res.data.data;
  },

  async getByReference(reference: string): Promise<Payment> {
    const res = await paymentApi.get<{
      message: string;
      data: Payment;
    }>(`/api/payments/${reference}`);
    return res.data.data;
  },

  async getByOrderId(orderId: number | string): Promise<Payment> {
    const res = await paymentApi.get<{
      message: string;
      data: Payment;
    }>(`/api/payments/order/${orderId}`);
    return res.data.data;
  },

  async refund(reference: string, data: { amount: number; reason?: string }): Promise<any> {
    const res = await paymentApi.post<{
      message: string;
      data: any;
    }>(`/api/payments/${reference}/refund`, data);
    return res.data.data;
  },

  async getSupportedProviders(): Promise<{
    defaultProvider: string;
    providers: string[];
  }> {
    const res = await paymentApi.get<{
      message: string;
      data: { defaultProvider: string; providers: string[] };
    }>("/api/payments/providers");
    return res.data.data;
  },
};
