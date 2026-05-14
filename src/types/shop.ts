export interface User {
  id: number;
  phone: string;
  full_name: string;
  email?: string;
  is_admin: boolean;
  balance?: number;
  cashback?: number;
  avatar?: string;
  snow_effect_enabled?: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  category_name: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  rejection_reason?: string;
  is_preorder?: boolean;
  amount_paid?: string;
  is_fully_paid?: boolean;
  payment_deadline?: string;
  custom_delivery_price?: number;
  delivery_price_set_by_admin?: boolean;
  delivery_type?: string;
  delivery_address?: string;
  second_payment_amount?: string;
  second_payment_paid?: boolean;
  delivery_paid?: boolean;
  cancellation_reason?: string;
  cancelled_by?: string;
  tracking_number?: string;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
}