import { orderApi } from "../axios";

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  vendorId?: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  imageUrl?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  customerEmail: string;
  customerName?: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "payment_failed";
  currency: string;
  subtotal: number;
  tax: number;
  shippingFee: number;
  totalAmount: number;
  shippingAddress?: any;
  paymentProvider: string;
  notes?: string;
  items: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderPayload {
  items: {
    productId: number;
    quantity: number;
    price?: number;
    name?: string;
    imageUrl?: string;
  }[];
  customerEmail?: string;
  customerName?: string;
  currency?: string;
  tax?: number;
  shippingFee?: number;
  shippingAddress?: any;
  paymentProvider?: "mock" | "stripe" | "paystack" | "flutterwave";
  notes?: string;
}

export interface PaginatedOrders {
  orders: Order[];
  pagination: {
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

export const orderService = {
  async create(data: CreateOrderPayload): Promise<Order> {
    const res = await orderApi.post<{
      message: string;
      data: Order;
    }>("/api/orders", data);
    return res.data.data;
  },

  async getAll(params?: { page?: number; limit?: number; status?: string; search?: string; all?: boolean }): Promise<PaginatedOrders> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.status) query.append("status", params.status);
    if (params?.search) query.append("search", params.search);
    if (params?.all) query.append("all", "true");

    const res = await orderApi.get<{
      message: string;
      data: PaginatedOrders;
    }>(`/api/orders?${query.toString()}`);
    return res.data.data;
  },

  async getById(idOrOrderNumber: number | string): Promise<Order> {
    const res = await orderApi.get<{
      message: string;
      data: Order;
    }>(`/api/orders/${idOrOrderNumber}`);
    return res.data.data;
  },

  async updateStatus(id: number | string, status: string, notes?: string): Promise<Order> {
    const res = await orderApi.patch<{
      message: string;
      data: Order;
    }>(`/api/orders/${id}/status`, { status, notes });
    return res.data.data;
  },

  async cancel(id: number | string, reason?: string): Promise<Order> {
    const res = await orderApi.post<{
      message: string;
      data: Order;
    }>(`/api/orders/${id}/cancel`, { reason });
    return res.data.data;
  },
};
