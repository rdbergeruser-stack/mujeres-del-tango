export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'user';
export type DeliveryType = 'envio' | 'retiro';
export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'delivered';
export type PaymentNotificationStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  role: UserRole;
  must_change_password: boolean;
  created_at: string;
}

export interface Collection {
  id: string;
  name: string;
  bio: string | null;
  instagram: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Remera {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  collection_name: string | null;
  sizes: string[];
  colors: string[];
  stock: number;
  image_url: string | null;
  gallery_urls: string[];
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  remera_id: string;
  selected_size: string;
  selected_color: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  delivery_type: DeliveryType;
  shipping_address: string | null;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  profile?: Profile;
  remera?: Remera;
  payment_notification?: PaymentNotification;
}

export interface PaymentNotification {
  id: string;
  order_id: string;
  user_id: string;
  reference_code: string;
  status: PaymentNotificationStatus;
  created_at: string;
  order?: Order;
  profile?: Profile;
}

export interface Database {
  public: {
    Tables: {
      tango_profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          address?: string | null;
          role?: UserRole;
          must_change_password?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          address?: string | null;
          role?: UserRole;
          must_change_password?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      tango_collections: {
        Row: Collection;
        Insert: {
          id?: string;
          name: string;
          bio?: string | null;
          instagram?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          bio?: string | null;
          instagram?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tango_remeras: {
        Row: Remera;
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          price: number;
          category?: string;
          collection_name?: string | null;
          sizes?: string[];
          colors?: string[];
          stock?: number;
          image_url?: string | null;
          gallery_urls?: string[];
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          price?: number;
          category?: string;
          collection_name?: string | null;
          sizes?: string[];
          colors?: string[];
          stock?: number;
          image_url?: string | null;
          gallery_urls?: string[];
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      tango_orders: {
        Row: {
          id: string;
          user_id: string;
          remera_id: string;
          selected_size: string;
          selected_color: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          delivery_type: DeliveryType;
          shipping_address: string | null;
          status: OrderStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          remera_id: string;
          selected_size: string;
          selected_color?: string | null;
          quantity?: number;
          unit_price: number;
          total_price: number;
          delivery_type: DeliveryType;
          shipping_address?: string | null;
          status?: OrderStatus;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          remera_id?: string;
          selected_size?: string;
          selected_color?: string | null;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          delivery_type?: DeliveryType;
          shipping_address?: string | null;
          status?: OrderStatus;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tango_payment_notifications: {
        Row: {
          id: string;
          order_id: string;
          user_id: string;
          reference_code: string;
          status: PaymentNotificationStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          user_id: string;
          reference_code: string;
          status?: PaymentNotificationStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          user_id?: string;
          reference_code?: string;
          status?: PaymentNotificationStatus;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      tango_is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
