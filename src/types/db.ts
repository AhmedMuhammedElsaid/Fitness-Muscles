export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      client_intake: {
        Row: {
          basic_info: Json | null
          body_metrics: Json | null
          completed_at: string | null
          created_at: string
          fitness_goals: Json | null
          health_restrictions: Json | null
          id: string
          nutrition_prefs: Json | null
          profile_id: string
          updated_at: string
          workout_prefs: Json | null
        }
        Insert: {
          basic_info?: Json | null
          body_metrics?: Json | null
          completed_at?: string | null
          created_at?: string
          fitness_goals?: Json | null
          health_restrictions?: Json | null
          id?: string
          nutrition_prefs?: Json | null
          profile_id: string
          updated_at?: string
          workout_prefs?: Json | null
        }
        Update: {
          basic_info?: Json | null
          body_metrics?: Json | null
          completed_at?: string | null
          created_at?: string
          fitness_goals?: Json | null
          health_restrictions?: Json | null
          id?: string
          nutrition_prefs?: Json | null
          profile_id?: string
          updated_at?: string
          workout_prefs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "client_intake_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_clients: {
        Row: {
          accepted_at: string
          client_id: string
          coach_id: string
          created_at: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string
          client_id: string
          coach_id: string
          created_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string
          client_id?: string
          coach_id?: string
          created_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_clients_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_invites: {
        Row: {
          coach_id: string
          code: string
          created_at: string
          expires_at: string
          single_use: boolean
          used_by: string | null
        }
        Insert: {
          coach_id: string
          code: string
          created_at?: string
          expires_at?: string
          single_use?: boolean
          used_by?: string | null
        }
        Update: {
          coach_id?: string
          code?: string
          created_at?: string
          expires_at?: string
          single_use?: boolean
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_invites_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_invites_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          coach_id: string
          created_at: string
          description: string | null
          equipment: string | null
          id: string
          muscle_group: string | null
          name: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          equipment?: string | null
          id?: string
          muscle_group?: string | null
          name: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          equipment?: string | null
          id?: string
          muscle_group?: string | null
          name?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_assignments: {
        Row: {
          client_id: string
          created_at: string
          id: string
          plan_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          plan_id: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          plan_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_assignments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_days: {
        Row: {
          day_of_week: number
          id: string
          plan_id: string
          week_number: number
          workout_id: string | null
        }
        Insert: {
          day_of_week: number
          id?: string
          plan_id: string
          week_number: number
          workout_id?: string | null
        }
        Update: {
          day_of_week?: number
          id?: string
          plan_id?: string
          week_number?: number
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_days_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          coach_id: string
          created_at: string
          description: string | null
          duration_weeks: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          duration_weeks?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          duration_weeks?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          locale: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          locale?: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          locale?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      progress_logs: {
        Row: {
          assignment_id: string
          client_id: string
          completed_at: string
          created_at: string
          id: string
          notes: string | null
          perceived_effort: number | null
          plan_day_id: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          client_id: string
          completed_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          perceived_effort?: number | null
          plan_day_id: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          client_id?: string
          completed_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          perceived_effort?: number | null
          plan_day_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "plan_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_plan_day_id_fkey"
            columns: ["plan_day_id"]
            isOneToOne: false
            referencedRelation: "plan_days"
            referencedColumns: ["id"]
          },
        ]
      }
      set_logs: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          progress_log_id: string
          reps_done: number | null
          set_number: number
          weight_done: number | null
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          progress_log_id: string
          reps_done?: number | null
          set_number: number
          weight_done?: number | null
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          progress_log_id?: string
          reps_done?: number | null
          set_number?: number
          weight_done?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_progress_log_id_fkey"
            columns: ["progress_log_id"]
            isOneToOne: false
            referencedRelation: "progress_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      tips: {
        Row: {
          body: string
          coach_id: string
          created_at: string
          id: string
        }
        Insert: {
          body: string
          coach_id: string
          created_at?: string
          id?: string
        }
        Update: {
          body?: string
          coach_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tips_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          exercise_id: string
          position: number
          reps: number
          rest_seconds: number
          sets: number
          weight_hint: string | null
          workout_id: string
        }
        Insert: {
          exercise_id: string
          position: number
          reps?: number
          rest_seconds?: number
          sets?: number
          weight_hint?: string | null
          workout_id: string
        }
        Update: {
          exercise_id?: string
          position?: number
          reps?: number
          rest_seconds?: number
          sets?: number
          weight_hint?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      client_can_see_exercise: { Args: { e: string }; Returns: boolean }
      client_can_see_workout: { Args: { w: string }; Returns: boolean }
      client_has_plan: { Args: { p: string }; Returns: boolean }
      client_owns_assignment: { Args: { a: string }; Returns: boolean }
      client_owns_log: { Args: { l: string }; Returns: boolean }
      coach_can_see_log: { Args: { l: string }; Returns: boolean }
      generate_invite_code: { Args: never; Returns: string }
      is_coach: { Args: never; Returns: boolean }
      is_my_client: { Args: { client: string }; Returns: boolean }
      my_coach_id: { Args: never; Returns: string }
      owns_plan: { Args: { p: string }; Returns: boolean }
      owns_workout: { Args: { w: string }; Returns: boolean }
      redeem_invite: { Args: { invite_code: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

