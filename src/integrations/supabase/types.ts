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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          app_subtitle: string
          app_title: string
          favicon_url: string | null
          id: string
          landing_content: Json
          logo_url: string | null
          meta_author: string
          meta_description: string
          og_title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          app_subtitle?: string
          app_title?: string
          favicon_url?: string | null
          id?: string
          landing_content?: Json
          logo_url?: string | null
          meta_author?: string
          meta_description?: string
          og_title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          app_subtitle?: string
          app_title?: string
          favicon_url?: string | null
          id?: string
          landing_content?: Json
          logo_url?: string | null
          meta_author?: string
          meta_description?: string
          og_title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          client_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          case_number: string
          client_id: string
          created_at: string
          description: string | null
          id: string
          matter: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_number: string
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          matter?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_number?: string
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          matter?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          cedula: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          cedula: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          cedula?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          message: string
          read: boolean
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          message: string
          read?: boolean
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          message?: string
          read?: boolean
        }
        Relationships: []
      }
      documents: {
        Row: {
          case_id: string
          content: string | null
          created_at: string
          drive_file_id: string | null
          event_date: string | null
          file_name: string | null
          id: string
          kind: string
          metadata: Json
          mime_type: string | null
          size_bytes: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_id: string
          content?: string | null
          created_at?: string
          drive_file_id?: string | null
          event_date?: string | null
          file_name?: string | null
          id?: string
          kind?: string
          metadata?: Json
          mime_type?: string | null
          size_bytes?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_id?: string
          content?: string | null
          created_at?: string
          drive_file_id?: string | null
          event_date?: string | null
          file_name?: string | null
          id?: string
          kind?: string
          metadata?: Json
          mime_type?: string | null
          size_bytes?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      fee_items: {
        Row: {
          amount_usd: number
          category_id: string
          created_at: string
          display_order: number
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          amount_usd?: number
          category_id: string
          created_at?: string
          display_order?: number
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          amount_usd?: number
          category_id?: string
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_percentage_tiers: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          max_amount_usd: number | null
          min_amount_usd: number
          percentage: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          max_amount_usd?: number | null
          min_amount_usd: number
          percentage: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          max_amount_usd?: number | null
          min_amount_usd?: number
          percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      prestaciones_settings: {
        Row: {
          created_at: string
          dias_adicionales_por_anio: number
          dias_mes_salario: number
          dias_por_trimestre: number
          id: string
          multiplicador_indemnizacion: number
          tasa_interes_anual_default: number
          tope_dias_adicionales: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          dias_adicionales_por_anio?: number
          dias_mes_salario?: number
          dias_por_trimestre?: number
          id?: string
          multiplicador_indemnizacion?: number
          tasa_interes_anual_default?: number
          tope_dias_adicionales?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          dias_adicionales_por_anio?: number
          dias_mes_salario?: number
          dias_por_trimestre?: number
          id?: string
          multiplicador_indemnizacion?: number
          tasa_interes_anual_default?: number
          tope_dias_adicionales?: number
          updated_at?: string
        }
        Relationships: []
      }
      prestaciones_tasas_bcv: {
        Row: {
          created_at: string
          id: string
          mes: string
          tasa_anual_porcentaje: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mes: string
          tasa_anual_porcentaje: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mes?: string
          tasa_anual_porcentaje?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_enabled: boolean
          bar_association: string | null
          city: string | null
          created_at: string
          directory_enabled: boolean
          email: string | null
          fees_enabled: boolean
          first_name: string | null
          google_connected_at: string | null
          google_email: string | null
          google_folder_id: string | null
          google_refresh_token: string | null
          id: string
          islr_enabled: boolean
          last_name: string | null
          photo_url: string | null
          prestaciones_enabled: boolean
          state: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          ai_enabled?: boolean
          bar_association?: string | null
          city?: string | null
          created_at?: string
          directory_enabled?: boolean
          email?: string | null
          fees_enabled?: boolean
          first_name?: string | null
          google_connected_at?: string | null
          google_email?: string | null
          google_folder_id?: string | null
          google_refresh_token?: string | null
          id?: string
          islr_enabled?: boolean
          last_name?: string | null
          photo_url?: string | null
          prestaciones_enabled?: boolean
          state?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          ai_enabled?: boolean
          bar_association?: string | null
          city?: string | null
          created_at?: string
          directory_enabled?: boolean
          email?: string | null
          fees_enabled?: boolean
          first_name?: string | null
          google_connected_at?: string | null
          google_email?: string | null
          google_folder_id?: string | null
          google_refresh_token?: string | null
          id?: string
          islr_enabled?: boolean
          last_name?: string | null
          photo_url?: string | null
          prestaciones_enabled?: boolean
          state?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      lawyers_directory: {
        Row: {
          bar_association: string | null
          city: string | null
          email: string | null
          first_name: string | null
          last_name: string | null
          photo_url: string | null
          state: string | null
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          bar_association?: string | null
          city?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          photo_url?: string | null
          state?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          bar_association?: string | null
          city?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          photo_url?: string | null
          state?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "lawyer"
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
      app_role: ["admin", "lawyer"],
    },
  },
} as const
