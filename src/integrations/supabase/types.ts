export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_analytics_report: {
        Row: {
          avg_client_rating: number | null
          avg_tasker_rating: number | null
          client_id: string
          commission_amount: number | null
          date_bucket: string
          id: string
          payment_bank: number | null
          payment_card: number | null
          payment_cash: number | null
          region: string | null
          snapshot_date: string
          tasker_id: string
          total_earnings: number | null
          total_tasks: number | null
        }
        Insert: {
          avg_client_rating?: number | null
          avg_tasker_rating?: number | null
          client_id: string
          commission_amount?: number | null
          date_bucket: string
          id?: string
          payment_bank?: number | null
          payment_card?: number | null
          payment_cash?: number | null
          region?: string | null
          snapshot_date?: string
          tasker_id: string
          total_earnings?: number | null
          total_tasks?: number | null
        }
        Update: {
          avg_client_rating?: number | null
          avg_tasker_rating?: number | null
          client_id?: string
          commission_amount?: number | null
          date_bucket?: string
          id?: string
          payment_bank?: number | null
          payment_card?: number | null
          payment_cash?: number | null
          region?: string | null
          snapshot_date?: string
          tasker_id?: string
          total_earnings?: number | null
          total_tasks?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
          task_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
          task_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "all_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "pending_taskers_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "all_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "pending_taskers_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_completed_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          offer_id: string | null
          task_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          offer_id?: string | null
          task_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          offer_id?: string | null
          task_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "view_client_received_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_own_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_completed_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          id: string
          is_accepted: boolean | null
          message: string | null
          price: number
          proposed_date: string | null
          proposed_time: string | null
          status: string | null
          task_id: string
          tasker_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_accepted?: boolean | null
          message?: string | null
          price: number
          proposed_date?: string | null
          proposed_time?: string | null
          status?: string | null
          task_id: string
          tasker_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_accepted?: boolean | null
          message?: string | null
          price?: number
          proposed_date?: string | null
          proposed_time?: string | null
          status?: string | null
          task_id?: string
          tasker_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_completed_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "all_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "pending_taskers_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          task_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          task_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_completed_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_requests: {
        Row: {
          accepted_offer_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          category: string
          client_id: string
          completed_at: string | null
          completion_proof_urls: string[] | null
          created_at: string
          description: string
          id: string
          location: string
          manual_address: string | null
          needs_location_review: boolean | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          price_range_max: number
          price_range_min: number
          required_date: string | null
          required_time: string | null
          status: Database["public"]["Enums"]["task_status"]
          subcategory: string | null
          title: string
          updated_at: string
        }
        Insert: {
          accepted_offer_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          category: string
          client_id: string
          completed_at?: string | null
          completion_proof_urls?: string[] | null
          created_at?: string
          description: string
          id?: string
          location: string
          manual_address?: string | null
          needs_location_review?: boolean | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          price_range_max: number
          price_range_min: number
          required_date?: string | null
          required_time?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          subcategory?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          accepted_offer_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          category?: string
          client_id?: string
          completed_at?: string | null
          completion_proof_urls?: string[] | null
          created_at?: string
          description?: string
          id?: string
          location?: string
          manual_address?: string | null
          needs_location_review?: boolean | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          price_range_max?: number
          price_range_min?: number
          required_date?: string | null
          required_time?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          subcategory?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_accepted_offer"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_accepted_offer"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "view_client_received_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_accepted_offer"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_own_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_accepted_offer_id_fkey"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_accepted_offer_id_fkey"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "view_client_received_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_accepted_offer_id_fkey"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_own_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "all_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "pending_taskers_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          admin_confirmed_at: string | null
          admin_confirmed_by: string | null
          amount: number
          client_id: string
          created_at: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["transaction_status"]
          task_id: string
          tasker_id: string
          updated_at: string
        }
        Insert: {
          admin_confirmed_at?: string | null
          admin_confirmed_by?: string | null
          amount: number
          client_id: string
          created_at?: string
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["transaction_status"]
          task_id: string
          tasker_id: string
          updated_at?: string
        }
        Update: {
          admin_confirmed_at?: string | null
          admin_confirmed_by?: string | null
          amount?: number
          client_id?: string
          created_at?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["transaction_status"]
          task_id?: string
          tasker_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_admin_confirmed_by_fkey"
            columns: ["admin_confirmed_by"]
            isOneToOne: false
            referencedRelation: "all_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_admin_confirmed_by_fkey"
            columns: ["admin_confirmed_by"]
            isOneToOne: false
            referencedRelation: "pending_taskers_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_admin_confirmed_by_fkey"
            columns: ["admin_confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "all_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "pending_taskers_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_completed_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "all_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "pending_taskers_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          approved: boolean
          created_at: string
          email: string
          email_notifications_enabled: boolean | null
          full_name: string
          id: string
          location: string | null
          phone_number: string | null
          rating: number | null
          role: Database["public"]["Enums"]["user_role"]
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          total_reviews: number | null
          updated_at: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          email: string
          email_notifications_enabled?: boolean | null
          full_name: string
          id: string
          location?: string | null
          phone_number?: string | null
          rating?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          total_reviews?: number | null
          updated_at?: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          email?: string
          email_notifications_enabled?: boolean | null
          full_name?: string
          id?: string
          location?: string | null
          phone_number?: string | null
          rating?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          total_reviews?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      all_users_view: {
        Row: {
          approved: boolean | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          location: string | null
          rating: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          total_reviews: number | null
        }
        Insert: {
          approved?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          location?: string | null
          rating?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          total_reviews?: number | null
        }
        Update: {
          approved?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          location?: string | null
          rating?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          total_reviews?: number | null
        }
        Relationships: []
      }
      pending_taskers_view: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
      view_client_received_offers: {
        Row: {
          created_at: string | null
          id: string | null
          is_accepted: boolean | null
          message: string | null
          price: number | null
          proposed_date: string | null
          proposed_time: string | null
          status: string | null
          task_id: string | null
          tasker_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_completed_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "all_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "pending_taskers_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      view_tasker_appointments: {
        Row: {
          accepted_offer_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          category: string | null
          client_id: string | null
          completed_at: string | null
          completion_proof_urls: string[] | null
          created_at: string | null
          description: string | null
          id: string | null
          location: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          price_range_max: number | null
          price_range_min: number | null
          required_date: string | null
          required_time: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          subcategory: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_accepted_offer"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_accepted_offer"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "view_client_received_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_accepted_offer"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_own_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_accepted_offer_id_fkey"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_accepted_offer_id_fkey"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "view_client_received_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_accepted_offer_id_fkey"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_own_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "all_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "pending_taskers_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      view_tasker_completed_tasks: {
        Row: {
          accepted_offer_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          category: string | null
          client_id: string | null
          completed_at: string | null
          completion_proof_urls: string[] | null
          created_at: string | null
          description: string | null
          id: string | null
          location: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          price_range_max: number | null
          price_range_min: number | null
          required_date: string | null
          required_time: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          subcategory: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_accepted_offer"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_accepted_offer"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "view_client_received_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_accepted_offer"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_own_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_accepted_offer_id_fkey"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_accepted_offer_id_fkey"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "view_client_received_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_accepted_offer_id_fkey"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_own_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "all_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "pending_taskers_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      view_tasker_own_offers: {
        Row: {
          created_at: string | null
          id: string | null
          is_accepted: boolean | null
          message: string | null
          price: number | null
          proposed_date: string | null
          proposed_time: string | null
          status: string | null
          task_id: string | null
          tasker_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_accepted?: boolean | null
          message?: string | null
          price?: number | null
          proposed_date?: string | null
          proposed_time?: string | null
          status?: string | null
          task_id?: string | null
          tasker_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_accepted?: boolean | null
          message?: string | null
          price?: number | null
          proposed_date?: string | null
          proposed_time?: string | null
          status?: string | null
          task_id?: string | null
          tasker_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "view_tasker_completed_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "all_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "pending_taskers_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_offer_and_reject_others: {
        Args: { offer_id_param: string; task_id_param: string }
        Returns: boolean
      }
      can_chat_on_task: {
        Args: { task_id: string }
        Returns: boolean
      }
      cancel_task: {
        Args: { task_id_param: string; reason?: string }
        Returns: boolean
      }
      complete_task: {
        Args: { task_id_param: string; proof_urls?: string[] }
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_unread_notification_count: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_task_owner: {
        Args: { task_id: string }
        Returns: boolean
      }
      is_tasker_on_task: {
        Args: { task_id: string }
        Returns: boolean
      }
      user_can_see_offer: {
        Args: { offer_id: string; user_id: string }
        Returns: boolean
      }
      user_can_see_profile: {
        Args: { profile_id: string; user_id: string }
        Returns: boolean
      }
      user_can_see_task: {
        Args: { task_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      payment_method: "cash" | "bank_transfer" | "card"
      task_status:
        | "pending"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
      transaction_status: "pending" | "confirmed" | "failed"
      user_role: "client" | "tasker" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      payment_method: ["cash", "bank_transfer", "card"],
      task_status: [
        "pending",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
      ],
      transaction_status: ["pending", "confirmed", "failed"],
      user_role: ["client", "tasker", "admin"],
    },
  },
} as const
