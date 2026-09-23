export type UserRole = 'CUSTOMER' | 'ADMIN' | 'user' | 'admin';

export type PaymentStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'expired';

export type ServiceStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'WAITING_FOR_FULFILLMENT'
  | 'PROCESSING'
  | 'PARTIALLY_COMPLETED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'ADMIN_APPROVED'
  | 'pending'
  | 'paid'
  | 'processing'
  | 'completed'
  | 'failed';

export type PackageCategory = 'INDONESIA' | 'INTERNATIONAL' | 'PROMOTION_PAID' | 'PROMOTION_FREE';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface Package {
  id: string;
  name: string;
  category?: PackageCategory;
  followers: number;
  price: number;
  description: string | null;
  estimated_processing_minutes?: number;
  estimated_time: string;
  badge?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  note: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_code: string;
  user_id: string | null;
  package_id: string;
  customer_name: string;
  customer_email: string;
  customer_whatsapp?: string;
  instagram_username: string;
  target_username?: string;
  instagram_url?: string | null;
  followers_amount: number;
  amount_followers?: number;
  price: number;
  amount?: number;
  payment_status: PaymentStatus | string;
  service_status: ServiceStatus | string;
  status?: ServiceStatus | string;
  payment_method: string;
  xendit_invoice_id?: string | null;
  xendit_payment_url?: string | null;
  is_admin_order?: boolean;
  payment_required?: boolean;
  admin_reason?: string | null;
  customer_note?: string | null;
  admin_note?: string | null;
  notes?: string | null;
  package_name?: string;
  package_category?: PackageCategory | string;
  created_at: string;
  updated_at?: string;
  packages?: Package;
  order_status_history?: OrderStatusHistory[];
}

export interface CreateOrderPayload {
  packageId: string;
  customerName: string;
  customerEmail: string;
  instagramUsername: string;
  paymentMethod?: string;
  customerNote?: string;
  userId?: string | null;
}
