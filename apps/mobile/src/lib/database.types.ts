export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      bookings: {
        Row: {
          client_id: string;
          coach_id: string;
          created_at: string;
          id: string;
          payment_status: string;
          request_id: string;
          request_seats: number;
          request_slot_id: string;
          revision: number;
          seats: number;
          slot_id: string;
          status: string;
          total_cents: number;
        };
        Insert: {
          client_id: string;
          coach_id: string;
          created_at?: string;
          id?: string;
          payment_status?: string;
          request_id: string;
          request_seats: number;
          request_slot_id: string;
          revision?: number;
          seats: number;
          slot_id: string;
          status?: string;
          total_cents: number;
        };
        Update: {
          client_id?: string;
          coach_id?: string;
          created_at?: string;
          id?: string;
          payment_status?: string;
          request_id?: string;
          request_seats?: number;
          request_slot_id?: string;
          revision?: number;
          seats?: number;
          slot_id?: string;
          status?: string;
          total_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "coaches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_slot_id_coach_id_fkey";
            columns: ["slot_id", "coach_id"];
            isOneToOne: false;
            referencedRelation: "slots";
            referencedColumns: ["id", "coach_id"];
          },
        ];
      };
      calendar_connections: {
        Row: {
          calendar_id: string;
          coach_id: string;
          error_code: string | null;
          id: string;
          provider: string;
          status: string;
          sync_until: string | null;
          synced_at: string | null;
        };
        Insert: {
          calendar_id?: string;
          coach_id: string;
          error_code?: string | null;
          id?: string;
          provider: string;
          status?: string;
          sync_until?: string | null;
          synced_at?: string | null;
        };
        Update: {
          calendar_id?: string;
          coach_id?: string;
          error_code?: string | null;
          id?: string;
          provider?: string;
          status?: string;
          sync_until?: string | null;
          synced_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_connections_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "coaches";
            referencedColumns: ["id"];
          },
        ];
      };
      coaches: {
        Row: {
          bio: string;
          city: string;
          display_name: string;
          id: string;
          latitude: number | null;
          longitude: number | null;
          published: boolean;
          sports: string[];
          travel_radius_km: number;
        };
        Insert: {
          bio?: string;
          city?: string;
          display_name: string;
          id: string;
          latitude?: number | null;
          longitude?: number | null;
          published?: boolean;
          sports?: string[];
          travel_radius_km?: number;
        };
        Update: {
          bio?: string;
          city?: string;
          display_name?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          published?: boolean;
          sports?: string[];
          travel_radius_km?: number;
        };
        Relationships: [
          {
            foreignKeyName: "coaches_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          booking_id: string | null;
          created_at: string;
          id: string;
          kind: string;
          read_at: string | null;
          recipient_id: string;
        };
        Insert: {
          body: string;
          booking_id?: string | null;
          created_at?: string;
          id?: string;
          kind: string;
          read_at?: string | null;
          recipient_id: string;
        };
        Update: {
          body?: string;
          booking_id?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          read_at?: string | null;
          recipient_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      offers: {
        Row: {
          active: boolean;
          capacity: number;
          coach_id: string;
          duration_minutes: number;
          format: string;
          id: string;
          price_cents: number;
          sport: string;
          title: string;
        };
        Insert: {
          active?: boolean;
          capacity: number;
          coach_id: string;
          duration_minutes: number;
          format: string;
          id?: string;
          price_cents: number;
          sport: string;
          title: string;
        };
        Update: {
          active?: boolean;
          capacity?: number;
          coach_id?: string;
          duration_minutes?: number;
          format?: string;
          id?: string;
          price_cents?: number;
          sport?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offers_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "coaches";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          phone: string;
          preferences: Json;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id: string;
          phone?: string;
          preferences?: Json;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          phone?: string;
          preferences?: Json;
        };
        Relationships: [];
      };
      slots: {
        Row: {
          capacity: number;
          coach_id: string;
          ends_at: string;
          id: string;
          latitude: number | null;
          location: string;
          longitude: number | null;
          offer_id: string;
          open: boolean;
          price_cents: number;
          starts_at: string;
        };
        Insert: {
          capacity: number;
          coach_id: string;
          ends_at: string;
          id?: string;
          latitude?: number | null;
          location: string;
          longitude?: number | null;
          offer_id: string;
          open?: boolean;
          price_cents: number;
          starts_at: string;
        };
        Update: {
          capacity?: number;
          coach_id?: string;
          ends_at?: string;
          id?: string;
          latitude?: number | null;
          location?: string;
          longitude?: number | null;
          offer_id?: string;
          open?: boolean;
          price_cents?: number;
          starts_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "slots_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "coaches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "slots_offer_id_coach_id_fkey";
            columns: ["offer_id", "coach_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id", "coach_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      change_booking: {
        Args: { p_booking: string; p_target?: string };
        Returns: {
          client_id: string;
          coach_id: string;
          created_at: string;
          id: string;
          payment_status: string;
          request_id: string;
          request_seats: number;
          request_slot_id: string;
          revision: number;
          seats: number;
          slot_id: string;
          status: string;
          total_cents: number;
        };
        SetofOptions: {
          from: "*";
          to: "bookings";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      open_slot: {
        Args: {
          p_lat?: number;
          p_lng?: number;
          p_location: string;
          p_offer: string;
          p_start: string;
        };
        Returns: {
          capacity: number;
          coach_id: string;
          ends_at: string;
          id: string;
          latitude: number | null;
          location: string;
          longitude: number | null;
          offer_id: string;
          open: boolean;
          price_cents: number;
          starts_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "slots";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      reserve_slot: {
        Args: { p_request: string; p_seats: number; p_slot: string };
        Returns: {
          client_id: string;
          coach_id: string;
          created_at: string;
          id: string;
          payment_status: string;
          request_id: string;
          request_seats: number;
          request_slot_id: string;
          revision: number;
          seats: number;
          slot_id: string;
          status: string;
          total_cents: number;
        };
        SetofOptions: {
          from: "*";
          to: "bookings";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      slot_inventory: {
        Args: { p_slots: string[] };
        Returns: {
          remaining: number;
          slot_id: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
