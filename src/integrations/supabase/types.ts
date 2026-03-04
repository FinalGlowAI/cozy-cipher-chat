export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      active_sessions: {
        Row: {
          created_at: string
          id: string
          last_active: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_active?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_active?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          source: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_usage: {
        Row: {
          created_at: string
          id: string
          text_decryptions: number
          text_encryptions: number
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          text_decryptions?: number
          text_encryptions?: number
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          text_decryptions?: number
          text_encryptions?: number
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      encrypted_images: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          storage_path: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          storage_path: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          storage_path?: string
        }
        Relationships: []
      }
      ephemeral_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room_id: string
          user_color: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room_id: string
          user_color: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          user_color?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ephemeral_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "ephemeral_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      ephemeral_rooms: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          is_locked: boolean
          room_code: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          is_locked?: boolean
          room_code: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          is_locked?: boolean
          room_code?: string
        }
        Relationships: []
      }
      free_users: {
        Row: {
          created_at: string | null
          email: string
          features: string[]
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          features?: string[]
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          features?: string[]
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      kicked_participants: {
        Row: {
          id: string
          kicked_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          kicked_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          kicked_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kicked_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "ephemeral_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_participants: {
        Row: {
          id: string
          joined_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "ephemeral_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          comment: string
          created_at: string
          id: string
          is_approved: boolean
          rating: number
          user_name: string
          user_title: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          is_approved?: boolean
          rating?: number
          user_name: string
          user_title?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          rating?: number
          user_name?: string
          user_title?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          id: string
          last_decay_at: string
          lifetime_earned: number
          total_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_decay_at?: string
          lifetime_earned?: number
          total_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_decay_at?: string
          lifetime_earned?: number
          total_credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_encrypted_images: { Args: never; Returns: number }
      delete_encrypted_image: { Args: { _code: string }; Returns: string }
      earn_credits: {
        Args: { p_amount: number; p_source: string; p_user_id: string }
        Returns: undefined
      }
      generate_room_code: { Args: never; Returns: string }
      get_room_by_code: {
        Args: { _room_code: string }
        Returns: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          is_locked: boolean
          room_code: string
        }[]
      }
      get_user_sessions: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          id: string
          last_active: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_daily_usage: {
        Args: { p_date: string; p_feature: string; p_user_id: string }
        Returns: undefined
      }
      is_free_user: { Args: never; Returns: boolean }
      is_premium_user: { Args: { user_id: string }; Returns: boolean }
      retrieve_encrypted_image: {
        Args: { _code: string }
        Returns: {
          code: string
          created_at: string
          expires_at: string
          storage_path: string
        }[]
      }
      spend_credits: {
        Args: { p_amount: number; p_source: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
