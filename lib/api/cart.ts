import { cartApi } from "../axios";

export interface CartItemProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  status: string;
  imageUrl?: string;
}

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  itemTotal: number;
  product?: CartItemProduct;
  availability?: {
    isAvailable: boolean;
    hasSufficientStock: boolean;
    availableStock: number | null;
    status: string;
    currentPrice: number;
    priceChanged: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Cart {
  id: number;
  userId: number;
  status: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  totalUniqueItems: number;
  isValid: boolean;
  updatedAt?: string;
}

export interface CartSubtotal {
  cartId: number;
  subtotal: number;
  itemCount: number;
  totalUniqueItems: number;
}

export interface CartValidationIssue {
  type: string;
  message: string;
  oldPrice?: number;
  newPrice?: number;
  availableStock?: number;
}

export interface CartValidationReport {
  cartId: number;
  isValid: boolean;
  hasIssues: boolean;
  issueCount: number;
  issues: CartValidationIssue[];
  items: any[];
  subtotal: number;
  itemCount: number;
}

export const cartService = {
  async getCart(): Promise<Cart> {
    const res = await cartApi.get<{
      message: string;
      data: Cart;
    }>("/api/cart");
    return res.data.data;
  },

  async addItem(productId: number, quantity: number = 1): Promise<Cart> {
    const res = await cartApi.post<{
      message: string;
      data: Cart;
    }>("/api/cart/items", { productId, quantity });
    return res.data.data;
  },

  async updateQuantity(itemIdOrProductId: number, quantity: number): Promise<Cart> {
    const res = await cartApi.patch<{
      message: string;
      data: Cart;
    }>(`/api/cart/items/${itemIdOrProductId}`, { quantity });
    return res.data.data;
  },

  async removeItem(itemIdOrProductId: number): Promise<Cart> {
    const res = await cartApi.delete<{
      message: string;
      data: Cart;
    }>(`/api/cart/items/${itemIdOrProductId}`);
    return res.data.data;
  },

  async clearCart(): Promise<Cart> {
    const res = await cartApi.delete<{
      message: string;
      data: Cart;
    }>("/api/cart");
    return res.data.data;
  },

  async getSubtotal(): Promise<CartSubtotal> {
    const res = await cartApi.get<{
      message: string;
      data: CartSubtotal;
    }>("/api/cart/subtotal");
    return res.data.data;
  },

  async validateCart(): Promise<CartValidationReport> {
    const res = await cartApi.post<{
      message: string;
      data: CartValidationReport;
    }>("/api/cart/validate");
    return res.data.data;
  },
};
