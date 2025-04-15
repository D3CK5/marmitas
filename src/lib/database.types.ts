
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: number
          created_at: string
          title: string
          description: string
          price: number
          category: string
          is_active: boolean
          stock: number
          images: string[]
          nutritional_info: Json | null
        }
        Insert: {
          id?: number
          created_at?: string
          title: string
          description: string
          price: number
          category: string
          is_active?: boolean
          stock: number
          images?: string[]
          nutritional_info?: Json | null
        }
        Update: {
          id?: number
          created_at?: string
          title?: string
          description?: string
          price?: number
          category?: string
          is_active?: boolean
          stock?: number
          images?: string[]
          nutritional_info?: Json | null
        }
      }
      orders: {
        Row: {
          id: number
          created_at: string
          user_id: string
          status: string
          total: number
          notes: string | null
          delivery_address: Json
        }
        Insert: {
          id?: number
          created_at?: string
          user_id: string
          status?: string
          total: number
          notes?: string | null
          delivery_address: Json
        }
        Update: {
          id?: number
          created_at?: string
          user_id?: string
          status?: string
          total?: number
          notes?: string | null
          delivery_address?: Json
        }
      }
      order_items: {
        Row: {
          id: number
          created_at: string
          order_id: number
          product_id: number
          quantity: number
          price: number
          notes: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          order_id: number
          product_id: number
          quantity: number
          price: number
          notes?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          order_id?: number
          product_id?: number
          quantity?: number
          price?: number
          notes?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          full_name: string
          avatar_url: string | null
          phone: string | null
          default_address: Json | null
          is_admin: boolean
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          full_name: string
          avatar_url?: string | null
          phone?: string | null
          default_address?: Json | null
          is_admin?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
          default_address?: Json | null
          is_admin?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
