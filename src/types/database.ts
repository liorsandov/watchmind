/**
 * Manually maintained Supabase types for the Task 3 schema.
 * Regenerate this file with `npm run db:types` after applying future migrations.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MediaType = "movie" | "tv";
export type InteractionType =
  | "watched_liked"
  | "watched_disliked"
  | "watched_neutral"
  | "interested"
  | "not_interested"
  | "skipped"
  | "unsure";
export type InteractionSource =
  | "onboarding"
  | "trending"
  | "popular"
  | "rate"
  | "discover"
  | "recommendation"
  | "watchlist"
  | "history"
  | "import";
export type InteractionEventAction = "created" | "changed" | "deleted";
export type RecommendationSessionStatus = "generating" | "ready" | "failed";
export type RecommendationEventType =
  | "impression"
  | "opened"
  | "saved"
  | "dismissed"
  | "rated";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          onboarding_step: number;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          onboarding_step?: number;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          onboarding_step?: number;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_items: {
        Row: {
          id: string;
          tmdb_id: number;
          media_type: MediaType;
          title: string;
          original_title: string | null;
          overview: string | null;
          poster_path: string | null;
          backdrop_path: string | null;
          release_date: string | null;
          original_language: string | null;
          genre_ids: number[];
          popularity: number | null;
          vote_average: number | null;
          vote_count: number | null;
          metadata_updated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tmdb_id: number;
          media_type: MediaType;
          title: string;
          original_title?: string | null;
          overview?: string | null;
          poster_path?: string | null;
          backdrop_path?: string | null;
          release_date?: string | null;
          original_language?: string | null;
          genre_ids?: number[];
          popularity?: number | null;
          vote_average?: number | null;
          vote_count?: number | null;
          metadata_updated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tmdb_id?: number;
          media_type?: MediaType;
          title?: string;
          original_title?: string | null;
          overview?: string | null;
          poster_path?: string | null;
          backdrop_path?: string | null;
          release_date?: string | null;
          original_language?: string | null;
          genre_ids?: number[];
          popularity?: number | null;
          vote_average?: number | null;
          vote_count?: number | null;
          metadata_updated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_content_interactions: {
        Row: {
          id: string;
          user_id: string;
          content_id: string;
          interaction_type: InteractionType;
          rating: number | null;
          source: InteractionSource;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          content_id: string;
          interaction_type: InteractionType;
          rating?: number | null;
          source: InteractionSource;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_id?: string;
          interaction_type?: InteractionType;
          rating?: number | null;
          source?: InteractionSource;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_content_interactions_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
        ];
      };
      user_content_interaction_events: {
        Row: {
          id: string;
          interaction_id: string | null;
          user_id: string;
          content_id: string;
          action: InteractionEventAction;
          interaction_type: InteractionType;
          rating: number | null;
          source: InteractionSource;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          interaction_id?: string | null;
          user_id: string;
          content_id: string;
          action: InteractionEventAction;
          interaction_type: InteractionType;
          rating?: number | null;
          source: InteractionSource;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          interaction_id?: string | null;
          user_id?: string;
          content_id?: string;
          action?: InteractionEventAction;
          interaction_type?: InteractionType;
          rating?: number | null;
          source?: InteractionSource;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_content_interaction_events_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_content_interaction_events_interaction_id_fkey";
            columns: ["interaction_id"];
            isOneToOne: false;
            referencedRelation: "user_content_interactions";
            referencedColumns: ["id"];
          },
        ];
      };
      user_watch_progress: {
        Row: {
          id: string;
          user_id: string;
          content_id: string;
          progress_percent: number;
          last_season_number: number | null;
          last_episode_number: number | null;
          completed: boolean;
          last_watched_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          content_id: string;
          progress_percent?: number;
          last_season_number?: number | null;
          last_episode_number?: number | null;
          completed?: boolean;
          last_watched_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_id?: string;
          progress_percent?: number;
          last_season_number?: number | null;
          last_episode_number?: number | null;
          completed?: boolean;
          last_watched_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_watch_progress_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          user_id: string;
          preferred_media_types: MediaType[];
          preferred_languages: string[];
          preferred_genre_ids: number[];
          excluded_genre_ids: number[];
          include_adult: boolean;
          minimum_release_year: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id?: string;
          preferred_media_types?: MediaType[];
          preferred_languages?: string[];
          preferred_genre_ids?: number[];
          excluded_genre_ids?: number[];
          include_adult?: boolean;
          minimum_release_year?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          preferred_media_types?: MediaType[];
          preferred_languages?: string[];
          preferred_genre_ids?: number[];
          excluded_genre_ids?: number[];
          include_adult?: boolean;
          minimum_release_year?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recommendation_sessions: {
        Row: {
          id: string;
          user_id: string;
          algorithm_version: string;
          status: RecommendationSessionStatus;
          input_snapshot: Json;
          result_snapshot: Json;
          generated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          algorithm_version: string;
          status?: RecommendationSessionStatus;
          input_snapshot?: Json;
          result_snapshot?: Json;
          generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          algorithm_version?: string;
          status?: RecommendationSessionStatus;
          input_snapshot?: Json;
          result_snapshot?: Json;
          generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recommendation_events: {
        Row: {
          id: string;
          user_id: string;
          recommendation_session_id: string | null;
          content_id: string;
          event_type: RecommendationEventType;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          recommendation_session_id?: string | null;
          content_id: string;
          event_type: RecommendationEventType;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recommendation_session_id?: string | null;
          content_id?: string;
          event_type?: RecommendationEventType;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recommendation_events_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recommendation_events_recommendation_session_id_fkey";
            columns: ["recommendation_session_id"];
            isOneToOne: false;
            referencedRelation: "recommendation_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      media_type: MediaType;
      interaction_type: InteractionType;
      interaction_source: InteractionSource;
      interaction_event_action: InteractionEventAction;
      recommendation_session_status: RecommendationSessionStatus;
      recommendation_event_type: RecommendationEventType;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Update"];
