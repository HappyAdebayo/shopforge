// Shared TypeScript types for ShopForge

export type UserRole = "user" | "admin" | "vendor";
export type VendorStatus = "none" | "pending" | "approved" | "rejected";
export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  vendorStatus: VendorStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: User;
}

export interface SignupResponse {
  message: string;
  data: {
    user: User;
  };
}

export interface VendorApplication {
  id: number;
  userId: number;
  businessName: string;
  description: string;
  logoUrl?: string | null;
  status: ApplicationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vendor {
  id: number;
  userId: number;
  businessName: string;
  description: string;
  logoUrl?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImage {
  id?: number;
  productId?: number;
  imageUrl: string;
  isPrimary: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: number;
  vendorId: number;
  categoryId: number;
  name: string;
  description: string;
  price: number | string;
  stock: number;
  status: "active" | "inactive";
  images?: ProductImage[];
  category?: Category;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedProducts {
  products: Product[];
  pagination: {
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
}

export interface VendorApplyFormData {
  businessName: string;
  description: string;
  logoUrl?: string;
}

export interface CreateProductFormData {
  vendorId: number;
  categoryId: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: {
    imageUrl: string;
    isPrimary: boolean;
  }[];
}

export interface CreateCategoryFormData {
  name: string;
  description?: string;
}

export type CallStatus = "ringing" | "accepted" | "rejected" | "ended";

export interface Call {
  id: number;
  callerId: number;
  vendorId: number;
  status: CallStatus;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CallResponse {
  message: string;
  data: Call;
}

export interface CallListResponse {
  message: string;
  data: Call[];
}

export type NotificationType =
  | "incoming_call"
  | "call_accepted"
  | "call_rejected"
  | "call_missed"
  | "vendor_application_submitted"
  | "vendor_application_approved"
  | "vendor_application_rejected"
  | string;

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string | null;
  isRead: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationPaginatedData {
  notifications: Notification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  unreadCount: number;
}

export interface NotificationListResponse {
  message: string;
  data: NotificationPaginatedData;
}

export interface NotificationUnreadCountResponse {
  message: string;
  data: {
    unreadCount: number;
  };
}

export interface NotificationResponse {
  message: string;
  data: Notification;
}

