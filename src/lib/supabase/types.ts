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
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          department: string | null;
          position: string | null;
          bio: string | null;
          xp: number;
          level: number;
          role: "user" | "moderator" | "admin" | "super_admin";
          streak_days: number;
          last_login_at: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          department?: string | null;
          position?: string | null;
          bio?: string | null;
          xp?: number;
          level?: number;
          role?: "user" | "moderator" | "admin" | "super_admin";
          streak_days?: number;
          last_login_at?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          department?: string | null;
          position?: string | null;
          bio?: string | null;
          xp?: number;
          level?: number;
          role?: "user" | "moderator" | "admin" | "super_admin";
          streak_days?: number;
          last_login_at?: string | null;
          onboarding_completed?: boolean;
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };

      community_posts: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          content: string;
          type: "discussion" | "idea" | "show_and_tell" | "question" | "challenge";
          category: string | null;
          tags: string[];
          upvotes_count: number;
          comments_count: number;
          views_count: number;
          is_pinned: boolean;
          is_resolved: boolean;
          ai_evaluation_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          content: string;
          type?: "discussion" | "idea" | "show_and_tell" | "question" | "challenge";
          category?: string | null;
          tags?: string[];
          upvotes_count?: number;
          comments_count?: number;
          views_count?: number;
          is_pinned?: boolean;
          is_resolved?: boolean;
          ai_evaluation_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          type?: "discussion" | "idea" | "show_and_tell" | "question" | "challenge";
          category?: string | null;
          tags?: string[];
          upvotes_count?: number;
          comments_count?: number;
          views_count?: number;
          is_pinned?: boolean;
          is_resolved?: boolean;
          ai_evaluation_score?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };

      comments: {
        Row: {
          id: string;
          entity_type: "best_practice" | "community_post";
          entity_id: string;
          parent_id: string | null;
          author_id: string;
          content: string;
          upvotes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          entity_type: "best_practice" | "community_post";
          entity_id: string;
          parent_id?: string | null;
          author_id: string;
          content: string;
          upvotes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          upvotes_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };

      upvotes: {
        Row: {
          user_id: string;
          entity_type: "best_practice" | "community_post";
          entity_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          entity_type: "best_practice" | "community_post";
          entity_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          entity_type?: "best_practice" | "community_post";
          entity_id?: string;
        };
        Relationships: [];
      };

      badges: {
        Row: {
          id: string;
          key: string;
          name: string;
          description: string;
          icon: string;
          category: "achievement" | "skill" | "social" | "special";
          xp_threshold: number | null;
          condition: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          description: string;
          icon: string;
          category?: "achievement" | "skill" | "social" | "special";
          xp_threshold?: number | null;
          condition?: string | null;
          created_at?: string;
        };
        Update: {
          key?: string;
          name?: string;
          description?: string;
          icon?: string;
          category?: "achievement" | "skill" | "social" | "special";
          xp_threshold?: number | null;
          condition?: string | null;
        };
        Relationships: [];
      };

      user_badges: {
        Row: {
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: {
          user_id?: string;
          badge_id?: string;
          earned_at?: string;
        };
        Relationships: [];
      };

      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "achievement" | "comment" | "like" | "challenge" | "system" | "mention";
          title: string;
          message: string;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "achievement" | "comment" | "like" | "challenge" | "system" | "mention";
          title: string;
          message: string;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          type?: "achievement" | "comment" | "like" | "challenge" | "system" | "mention";
          title?: string;
          message?: string;
          link?: string | null;
          is_read?: boolean;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };

      ai_providers: {
        Row: {
          id: string;
          provider_key: string;
          display_name: string;
          api_endpoint: string;
          api_key_encrypted: string | null;
          model: string;
          temperature: number;
          max_tokens: number;
          top_p: number;
          is_active: boolean;
          is_primary: boolean;
          fallback_provider_id: string | null;
          monthly_budget_limit: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_key: string;
          display_name: string;
          api_endpoint: string;
          api_key_encrypted?: string | null;
          model: string;
          temperature?: number;
          max_tokens?: number;
          top_p?: number;
          is_active?: boolean;
          is_primary?: boolean;
          fallback_provider_id?: string | null;
          monthly_budget_limit?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider_key?: string;
          display_name?: string;
          api_endpoint?: string;
          api_key_encrypted?: string | null;
          model?: string;
          temperature?: number;
          max_tokens?: number;
          top_p?: number;
          is_active?: boolean;
          is_primary?: boolean;
          fallback_provider_id?: string | null;
          monthly_budget_limit?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };

      ai_cost_log: {
        Row: {
          id: string;
          provider_id: string;
          feature: "mentor_chat" | "usecase_eval" | "search" | "auto_tag" | "summary";
          tokens_input: number;
          tokens_output: number;
          estimated_cost: number;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          feature: "mentor_chat" | "usecase_eval" | "search" | "auto_tag" | "summary";
          tokens_input?: number;
          tokens_output?: number;
          estimated_cost?: number;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          provider_id?: string;
          feature?: "mentor_chat" | "usecase_eval" | "search" | "auto_tag" | "summary";
          tokens_input?: number;
          tokens_output?: number;
          estimated_cost?: number;
          user_id?: string | null;
        };
        Relationships: [];
      };

      system_prompts: {
        Row: {
          id: string;
          prompt_key: string;
          prompt_text: string;
          version: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt_key: string;
          prompt_text: string;
          version?: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          prompt_key?: string;
          prompt_text?: string;
          version?: number;
          is_active?: boolean;
          created_by?: string | null;
        };
        Relationships: [];
      };

      feature_flags: {
        Row: {
          id: string;
          flag_key: string;
          name: string;
          description: string;
          enabled: boolean;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          flag_key: string;
          name: string;
          description?: string;
          enabled?: boolean;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          flag_key?: string;
          name?: string;
          description?: string;
          enabled?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      award_xp: {
        Args: {
          target_user_id: string;
          xp_amount: number;
        };
        Returns: {
          new_xp: number;
          new_level: number;
          leveled_up: boolean;
        }[];
      };
      increment_field: {
        Args: {
          table_name: string;
          row_id: string;
          field_name: string;
          increment_by?: number;
        };
        Returns: undefined;
      };
    };

    Enums: {
      user_role: "user" | "moderator" | "admin" | "super_admin";
      difficulty_level: "beginner" | "intermediate" | "advanced";
      content_status: "draft" | "published" | "archived";
      community_post_type: "discussion" | "idea" | "show_and_tell" | "question" | "challenge";
      entity_type: "best_practice" | "community_post";
      badge_category: "achievement" | "skill" | "social" | "special";
      notification_type: "achievement" | "comment" | "like" | "challenge" | "system" | "mention";
      ai_provider: "gemini" | "claude" | "openai" | "copilot";
      ai_feature_type: "mentor_chat" | "usecase_eval" | "search" | "auto_tag" | "summary";
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
