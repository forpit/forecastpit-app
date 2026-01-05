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
      agents: {
        Row: {
          cash_balance: number
          created_at: string | null
          id: string
          model_id: string
          season_id: string
          status: string
          total_invested: number
        }
        Insert: {
          cash_balance?: number
          created_at?: string | null
          id?: string
          model_id: string
          season_id: string
          status?: string
          total_invested?: number
        }
        Update: {
          cash_balance?: number
          created_at?: string | null
          id?: string
          model_id?: string
          season_id?: string
          status?: string
          total_invested?: number
        }
        Relationships: [
          {
            foreignKeyName: "agents_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      api_costs: {
        Row: {
          cost_usd: number | null
          decision_id: string | null
          id: string
          model_id: string
          recorded_at: string | null
          tokens_input: number | null
          tokens_output: number | null
        }
        Insert: {
          cost_usd?: number | null
          decision_id?: string | null
          id?: string
          model_id: string
          recorded_at?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Update: {
          cost_usd?: number | null
          decision_id?: string | null
          id?: string
          model_id?: string
          recorded_at?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_costs_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_costs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          action: string
          agent_id: string
          api_cost_usd: number | null
          created_at: string | null
          decision_day: number
          decision_timestamp: string
          error_message: string | null
          id: string
          parsed_response: Json | null
          prompt_system: string
          prompt_user: string
          raw_response: string | null
          reasoning: string | null
          response_time_ms: number | null
          retry_count: number | null
          season_id: string
          tokens_input: number | null
          tokens_output: number | null
        }
        Insert: {
          action: string
          agent_id: string
          api_cost_usd?: number | null
          created_at?: string | null
          decision_day: number
          decision_timestamp?: string
          error_message?: string | null
          id?: string
          parsed_response?: Json | null
          prompt_system: string
          prompt_user: string
          raw_response?: string | null
          reasoning?: string | null
          response_time_ms?: number | null
          retry_count?: number | null
          season_id: string
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Update: {
          action?: string
          agent_id?: string
          api_cost_usd?: number | null
          created_at?: string | null
          decision_day?: number
          decision_timestamp?: string
          error_message?: string | null
          id?: string
          parsed_response?: Json | null
          prompt_system?: string
          prompt_user?: string
          raw_response?: string | null
          reasoning?: string | null
          response_time_ms?: number | null
          retry_count?: number | null
          season_id?: string
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          category: string | null
          close_date: string
          current_price: number | null
          current_prices: Json | null
          description: string | null
          event_slug: string | null
          first_seen_at: string | null
          id: string
          last_updated_at: string | null
          liquidity: number | null
          market_type: string
          outcomes: Json | null
          polymarket_id: string
          question: string
          resolution_outcome: string | null
          resolved_at: string | null
          slug: string | null
          status: string
          volume: number | null
        }
        Insert: {
          category?: string | null
          close_date: string
          current_price?: number | null
          current_prices?: Json | null
          description?: string | null
          event_slug?: string | null
          first_seen_at?: string | null
          id?: string
          last_updated_at?: string | null
          liquidity?: number | null
          market_type?: string
          outcomes?: Json | null
          polymarket_id: string
          question: string
          resolution_outcome?: string | null
          resolved_at?: string | null
          slug?: string | null
          status?: string
          volume?: number | null
        }
        Update: {
          category?: string | null
          close_date?: string
          current_price?: number | null
          current_prices?: Json | null
          description?: string | null
          event_slug?: string | null
          first_seen_at?: string | null
          id?: string
          last_updated_at?: string | null
          liquidity?: number | null
          market_type?: string
          outcomes?: Json | null
          polymarket_id?: string
          question?: string
          resolution_outcome?: string | null
          resolved_at?: string | null
          slug?: string | null
          status?: string
          volume?: number | null
        }
        Relationships: []
      }
      methodology_versions: {
        Row: {
          changes_summary: string | null
          created_at: string | null
          description: string
          document_hash: string | null
          effective_from_season: number | null
          title: string
          version: string
        }
        Insert: {
          changes_summary?: string | null
          created_at?: string | null
          description: string
          document_hash?: string | null
          effective_from_season?: number | null
          title: string
          version: string
        }
        Update: {
          changes_summary?: string | null
          created_at?: string | null
          description?: string
          document_hash?: string | null
          effective_from_season?: number | null
          title?: string
          version?: string
        }
        Relationships: []
      }
      models: {
        Row: {
          added_at: string | null
          color: string | null
          display_name: string
          id: string
          is_active: boolean | null
          openrouter_id: string
          provider: string
        }
        Insert: {
          added_at?: string | null
          color?: string | null
          display_name: string
          id: string
          is_active?: boolean | null
          openrouter_id: string
          provider: string
        }
        Update: {
          added_at?: string | null
          color?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          openrouter_id?: string
          provider?: string
        }
        Relationships: []
      }
      portfolio_snapshots: {
        Row: {
          agent_id: string
          cash_balance: number
          created_at: string | null
          id: string
          positions_value: number
          snapshot_timestamp: string
          total_pnl: number
          total_pnl_percent: number
          total_value: number
        }
        Insert: {
          agent_id: string
          cash_balance: number
          created_at?: string | null
          id?: string
          positions_value: number
          snapshot_timestamp: string
          total_pnl: number
          total_pnl_percent: number
          total_value: number
        }
        Update: {
          agent_id?: string
          cash_balance?: number
          created_at?: string | null
          id?: string
          positions_value?: number
          snapshot_timestamp?: string
          total_pnl?: number
          total_pnl_percent?: number
          total_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_snapshots_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          agent_id: string
          avg_entry_price: number
          closed_at: string | null
          current_value: number | null
          id: string
          market_id: string
          opened_at: string | null
          shares: number
          side: string
          status: string
          total_cost: number
          unrealized_pnl: number | null
        }
        Insert: {
          agent_id: string
          avg_entry_price: number
          closed_at?: string | null
          current_value?: number | null
          id?: string
          market_id: string
          opened_at?: string | null
          shares: number
          side: string
          status?: string
          total_cost: number
          unrealized_pnl?: number | null
        }
        Update: {
          agent_id?: string
          avg_entry_price?: number
          closed_at?: string | null
          current_value?: number | null
          id?: string
          market_id?: string
          opened_at?: string | null
          shares?: number
          side?: string
          status?: string
          total_cost?: number
          unrealized_pnl?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          initial_balance: number
          methodology_version: string
          season_number: number
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          initial_balance?: number
          methodology_version?: string
          season_number: number
          started_at: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          initial_balance?: number
          methodology_version?: string
          season_number?: number
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_methodology_version_fkey"
            columns: ["methodology_version"]
            isOneToOne: false
            referencedRelation: "methodology_versions"
            referencedColumns: ["version"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          severity: string | null
        }
        Insert: {
          created_at: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          severity?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          severity?: string | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          agent_id: string
          cost_basis: number | null
          decision_id: string | null
          executed_at: string | null
          id: string
          implied_confidence: number | null
          market_id: string
          position_id: string | null
          price: number
          realized_pnl: number | null
          shares: number
          side: string
          total_amount: number
          trade_type: string
        }
        Insert: {
          agent_id: string
          cost_basis?: number | null
          decision_id?: string | null
          executed_at?: string | null
          id?: string
          implied_confidence?: number | null
          market_id: string
          position_id?: string | null
          price: number
          realized_pnl?: number | null
          shares: number
          side: string
          total_amount: number
          trade_type: string
        }
        Update: {
          agent_id?: string
          cost_basis?: number | null
          decision_id?: string | null
          executed_at?: string | null
          id?: string
          implied_confidence?: number | null
          market_id?: string
          position_id?: string | null
          price?: number
          realized_pnl?: number | null
          shares?: number
          side?: string
          total_amount?: number
          trade_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_agent_invested: { Args: { agent_id: string }; Returns: undefined }
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
  public: {
    Enums: {},
  },
} as const
