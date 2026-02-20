// =============================================================================
// Supabase Database Types
// Auto-generated via: npx supabase gen types typescript --local > src/lib/supabase/types.ts
// This file contains placeholder types. Regenerate after schema creation.
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "user" | "moderator" | "admin" | "super_admin";
          lr_partner_id: string | null;
          level: number;
          xp_points: number;
          badges: string[];
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "moderator" | "admin" | "super_admin";
          lr_partner_id?: string | null;
          level?: number;
          xp_points?: number;
          badges?: string[];
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "moderator" | "admin" | "super_admin";
          lr_partner_id?: string | null;
          level?: number;
          xp_points?: number;
          badges?: string[];
          onboarding_completed?: boolean;
          updated_at?: string;
        };
      };

      best_practices: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          content: string;
          category: string;
          tags: string[];
          ai_tool: string | null;
          difficulty: "beginner" | "intermediate" | "advanced";
          likes_count: number;
          views_count: number;
          is_featured: boolean;
          status: "draft" | "published" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          content: string;
          category: string;
          tags?: string[];
          ai_tool?: string | null;
          difficulty?: "beginner" | "intermediate" | "advanced";
          likes_count?: number;
          views_count?: number;
          is_featured?: boolean;
          status?: "draft" | "published" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          category?: string;
          tags?: string[];
          ai_tool?: string | null;
          difficulty?: "beginner" | "intermediate" | "advanced";
          likes_count?: number;
          views_count?: number;
          is_featured?: boolean;
          status?: "draft" | "published" | "archived";
          updated_at?: string;
        };
      };

      courses: {
        Row: {
          id: string;
          title: string;
          description: string;
          thumbnail_url: string | null;
          category: string;
          difficulty: "beginner" | "intermediate" | "advanced";
          estimated_duration_minutes: number;
          lessons_count: number;
          xp_reward: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          thumbnail_url?: string | null;
          category: string;
          difficulty?: "beginner" | "intermediate" | "advanced";
          estimated_duration_minutes: number;
          lessons_count?: number;
          xp_reward?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          thumbnail_url?: string | null;
          category?: string;
          difficulty?: "beginner" | "intermediate" | "advanced";
          estimated_duration_minutes?: number;
          lessons_count?: number;
          xp_reward?: number;
          is_published?: boolean;
          updated_at?: string;
        };
      };

      lessons: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          content: string;
          order_index: number;
          lesson_type: "text" | "video" | "interactive" | "quiz";
          duration_minutes: number;
          xp_reward: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          content: string;
          order_index: number;
          lesson_type?: "text" | "video" | "interactive" | "quiz";
          duration_minutes?: number;
          xp_reward?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          order_index?: number;
          lesson_type?: "text" | "video" | "interactive" | "quiz";
          duration_minutes?: number;
          xp_reward?: number;
          updated_at?: string;
        };
      };

      community_posts: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          content: string;
          category: string;
          tags: string[];
          likes_count: number;
          comments_count: number;
          is_pinned: boolean;
          status: "active" | "closed" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          content: string;
          category: string;
          tags?: string[];
          likes_count?: number;
          comments_count?: number;
          is_pinned?: boolean;
          status?: "active" | "closed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          category?: string;
          tags?: string[];
          likes_count?: number;
          comments_count?: number;
          is_pinned?: boolean;
          status?: "active" | "closed" | "archived";
          updated_at?: string;
        };
      };

      ai_chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          provider: "gemini" | "claude" | "openai" | "copilot";
          model: string;
          messages_count: number;
          last_message_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          provider: "gemini" | "claude" | "openai" | "copilot";
          model: string;
          messages_count?: number;
          last_message_at?: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          provider?: "gemini" | "claude" | "openai" | "copilot";
          model?: string;
          messages_count?: number;
          last_message_at?: string;
        };
      };

      ai_chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          provider: string;
          model: string;
          tokens_used: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          provider: string;
          model: string;
          tokens_used?: number | null;
          created_at?: string;
        };
        Update: {
          content?: string;
          tokens_used?: number | null;
        };
      };

      challenges: {
        Row: {
          id: string;
          title: string;
          description: string;
          challenge_type: "daily" | "weekly" | "special";
          difficulty: "beginner" | "intermediate" | "advanced";
          xp_reward: number;
          badge_reward: string | null;
          starts_at: string;
          ends_at: string;
          max_participants: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          challenge_type: "daily" | "weekly" | "special";
          difficulty?: "beginner" | "intermediate" | "advanced";
          xp_reward?: number;
          badge_reward?: string | null;
          starts_at: string;
          ends_at: string;
          max_participants?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          challenge_type?: "daily" | "weekly" | "special";
          difficulty?: "beginner" | "intermediate" | "advanced";
          xp_reward?: number;
          badge_reward?: string | null;
          starts_at?: string;
          ends_at?: string;
          max_participants?: number | null;
          is_active?: boolean;
        };
      };

      innovation_radar_items: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: "tools" | "techniques" | "platforms" | "frameworks";
          ring: "adopt" | "trial" | "assess" | "hold";
          url: string | null;
          added_by: string;
          votes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: "tools" | "techniques" | "platforms" | "frameworks";
          ring: "adopt" | "trial" | "assess" | "hold";
          url?: string | null;
          added_by: string;
          votes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          category?: "tools" | "techniques" | "platforms" | "frameworks";
          ring?: "adopt" | "trial" | "assess" | "hold";
          url?: string | null;
          votes_count?: number;
          updated_at?: string;
        };
      };

      user_progress: {
        Row: {
          id: string;
          user_id: string;
          course_id: string | null;
          lesson_id: string | null;
          challenge_id: string | null;
          progress_type: "course" | "lesson" | "challenge";
          status: "started" | "in_progress" | "completed";
          score: number | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id?: string | null;
          lesson_id?: string | null;
          challenge_id?: string | null;
          progress_type: "course" | "lesson" | "challenge";
          status?: "started" | "in_progress" | "completed";
          score?: number | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "started" | "in_progress" | "completed";
          score?: number | null;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      [_ in never]: never;
    };

    Enums: {
      user_role: "user" | "moderator" | "admin" | "super_admin";
      difficulty_level: "beginner" | "intermediate" | "advanced";
      content_status: "draft" | "published" | "archived";
      ai_provider: "gemini" | "claude" | "openai" | "copilot";
      challenge_type: "daily" | "weekly" | "special";
      radar_category: "tools" | "techniques" | "platforms" | "frameworks";
      radar_ring: "adopt" | "trial" | "assess" | "hold";
    };
  };
}

// ---------------------------------------------------------------------------
// Convenience Types
// ---------------------------------------------------------------------------
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
