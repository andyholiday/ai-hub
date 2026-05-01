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
      achievements: {
        Row: {
          category: Database["public"]["Enums"]["achievement_category"]
          created_at: string
          description: string
          icon: string
          id: string
          is_hidden: boolean
          key: string
          requirement_type: Database["public"]["Enums"]["achievement_requirement_type"]
          requirement_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["achievement_category"]
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_hidden?: boolean
          key: string
          requirement_type: Database["public"]["Enums"]["achievement_requirement_type"]
          requirement_value?: number
          title: string
          xp_reward?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["achievement_category"]
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_hidden?: boolean
          key?: string
          requirement_type?: Database["public"]["Enums"]["achievement_requirement_type"]
          requirement_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["chat_message_role"]
          session_id: string
          tokens_used: number | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["chat_message_role"]
          session_id: string
          tokens_used?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["chat_message_role"]
          session_id?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_sessions: {
        Row: {
          context_id: string | null
          context_type: string | null
          created_at: string
          id: string
          provider_used: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          provider_used?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          provider_used?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_cost_log: {
        Row: {
          created_at: string
          estimated_cost: number
          feature: Database["public"]["Enums"]["ai_feature_type"]
          id: string
          provider_id: string
          tokens_input: number
          tokens_output: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          estimated_cost?: number
          feature: Database["public"]["Enums"]["ai_feature_type"]
          id?: string
          provider_id: string
          tokens_input?: number
          tokens_output?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          estimated_cost?: number
          feature?: Database["public"]["Enums"]["ai_feature_type"]
          id?: string
          provider_id?: string
          tokens_input?: number
          tokens_output?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_cost_log_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_cost_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers: {
        Row: {
          api_endpoint: string
          api_key_encrypted: string | null
          created_at: string
          display_name: string
          fallback_provider_id: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          max_tokens: number
          model: string
          monthly_budget_limit: number | null
          provider_key: string
          temperature: number
          top_p: number
          updated_at: string
        }
        Insert: {
          api_endpoint: string
          api_key_encrypted?: string | null
          created_at?: string
          display_name: string
          fallback_provider_id?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          max_tokens?: number
          model: string
          monthly_budget_limit?: number | null
          provider_key: string
          temperature?: number
          top_p?: number
          updated_at?: string
        }
        Update: {
          api_endpoint?: string
          api_key_encrypted?: string | null
          created_at?: string
          display_name?: string
          fallback_provider_id?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          max_tokens?: number
          model?: string
          monthly_budget_limit?: number | null
          provider_key?: string
          temperature?: number
          top_p?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_providers_fallback_provider_id_fkey"
            columns: ["fallback_provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: Database["public"]["Enums"]["badge_category"]
          condition: string | null
          created_at: string
          description: string
          icon: string
          id: string
          key: string
          name: string
          xp_threshold: number | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["badge_category"]
          condition?: string | null
          created_at?: string
          description: string
          icon: string
          id?: string
          key: string
          name: string
          xp_threshold?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["badge_category"]
          condition?: string | null
          created_at?: string
          description?: string
          icon?: string
          id?: string
          key?: string
          name?: string
          xp_threshold?: number | null
        }
        Relationships: []
      }
      best_practices: {
        Row: {
          ai_summary: string | null
          ai_tags: string[] | null
          author_id: string
          category: Database["public"]["Enums"]["best_practice_category"]
          comments_count: number
          content: string
          created_at: string
          embedding: string | null
          excerpt: string | null
          id: string
          is_featured: boolean
          status: Database["public"]["Enums"]["content_status"]
          tags: string[] | null
          title: string
          updated_at: string
          upvotes_count: number
          views_count: number
        }
        Insert: {
          ai_summary?: string | null
          ai_tags?: string[] | null
          author_id: string
          category?: Database["public"]["Enums"]["best_practice_category"]
          comments_count?: number
          content: string
          created_at?: string
          embedding?: string | null
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          upvotes_count?: number
          views_count?: number
        }
        Update: {
          ai_summary?: string | null
          ai_tags?: string[] | null
          author_id?: string
          category?: Database["public"]["Enums"]["best_practice_category"]
          comments_count?: number
          content?: string
          created_at?: string
          embedding?: string | null
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          upvotes_count?: number
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "best_practices_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          end_date: string
          id: string
          is_active: boolean
          max_participants: number | null
          start_date: string
          title: string
          type: Database["public"]["Enums"]["challenge_type"]
          xp_reward: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          end_date: string
          id?: string
          is_active?: boolean
          max_participants?: number | null
          start_date: string
          title: string
          type?: Database["public"]["Enums"]["challenge_type"]
          xp_reward?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          end_date?: string
          id?: string
          is_active?: boolean
          max_participants?: number | null
          start_date?: string
          title?: string
          type?: Database["public"]["Enums"]["challenge_type"]
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          parent_id: string | null
          updated_at: string
          upvotes_count: number
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          parent_id?: string | null
          updated_at?: string
          upvotes_count?: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          parent_id?: string | null
          updated_at?: string
          upvotes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          ai_evaluation_score: number | null
          author_id: string
          category: string | null
          comments_count: number
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          is_resolved: boolean
          tags: string[] | null
          title: string
          type: Database["public"]["Enums"]["community_post_type"]
          updated_at: string
          upvotes_count: number
          views_count: number
        }
        Insert: {
          ai_evaluation_score?: number | null
          author_id: string
          category?: string | null
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_resolved?: boolean
          tags?: string[] | null
          title: string
          type?: Database["public"]["Enums"]["community_post_type"]
          updated_at?: string
          upvotes_count?: number
          views_count?: number
        }
        Update: {
          ai_evaluation_score?: number | null
          author_id?: string
          category?: string | null
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_resolved?: boolean
          tags?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["community_post_type"]
          updated_at?: string
          upvotes_count?: number
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          author_id: string | null
          category: string
          created_at: string
          description: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          duration_minutes: number
          id: string
          is_published: boolean
          lessons_count: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          author_id?: string | null
          category: string
          created_at?: string
          description: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          duration_minutes?: number
          id?: string
          is_published?: boolean
          lessons_count?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          author_id?: string | null
          category?: string
          created_at?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          duration_minutes?: number
          id?: string
          is_published?: boolean
          lessons_count?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "courses_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string
          enabled: boolean
          flag_key: string
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          enabled?: boolean
          flag_key: string
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          enabled?: boolean
          flag_key?: string
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_erasure_log: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          ip_hash: string | null
          requested_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          ip_hash?: string | null
          requested_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          ip_hash?: string | null
          requested_at?: string
          user_id?: string
        }
        Relationships: []
      }
      innovation_radar_items: {
        Row: {
          added_by: string | null
          category: Database["public"]["Enums"]["radar_category"]
          created_at: string
          description: string
          embedding: string | null
          id: string
          related_experts: string[] | null
          related_posts: string[] | null
          relevance_score: number | null
          ring: Database["public"]["Enums"]["radar_ring"]
          title: string
          trend_direction: Database["public"]["Enums"]["trend_direction"]
          updated_at: string
          url: string | null
          votes_count: number
        }
        Insert: {
          added_by?: string | null
          category: Database["public"]["Enums"]["radar_category"]
          created_at?: string
          description: string
          embedding?: string | null
          id?: string
          related_experts?: string[] | null
          related_posts?: string[] | null
          relevance_score?: number | null
          ring?: Database["public"]["Enums"]["radar_ring"]
          title: string
          trend_direction?: Database["public"]["Enums"]["trend_direction"]
          updated_at?: string
          url?: string | null
          votes_count?: number
        }
        Update: {
          added_by?: string | null
          category?: Database["public"]["Enums"]["radar_category"]
          created_at?: string
          description?: string
          embedding?: string | null
          id?: string
          related_experts?: string[] | null
          related_posts?: string[] | null
          relevance_score?: number | null
          ring?: Database["public"]["Enums"]["radar_ring"]
          title?: string
          trend_direction?: Database["public"]["Enums"]["trend_direction"]
          updated_at?: string
          url?: string | null
          votes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "innovation_radar_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_courses: {
        Row: {
          course_id: string
          id: string
          is_required: boolean
          learning_path_id: string
          order_index: number
        }
        Insert: {
          course_id: string
          id?: string
          is_required?: boolean
          learning_path_id: string
          order_index?: number
        }
        Update: {
          course_id?: string
          id?: string
          is_required?: boolean
          learning_path_id?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_courses_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          color: string | null
          created_at: string
          description: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          estimated_hours: number
          icon: string | null
          id: string
          is_published: boolean
          order_index: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          estimated_hours?: number
          icon?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          estimated_hours?: number
          icon?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content: string
          course_id: string
          created_at: string
          duration_minutes: number
          id: string
          order_index: number
          title: string
          type: Database["public"]["Enums"]["lesson_type"]
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          order_index?: number
          title: string
          type?: Database["public"]["Enums"]["lesson_type"]
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          order_index?: number
          title?: string
          type?: Database["public"]["Enums"]["lesson_type"]
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_signals: {
        Row: {
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_dismissed: boolean
          is_read: boolean
          metadata: Json | null
          page_context: string
          priority: number
          shown_at: string | null
          signal_type: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          metadata?: Json | null
          page_context?: string
          priority?: number
          shown_at?: string | null
          signal_type: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          metadata?: Json | null
          page_context?: string
          priority?: number
          shown_at?: string | null
          signal_type?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          department: string | null
          full_name: string | null
          id: string
          is_approved: boolean
          last_login_at: string | null
          level: number
          longest_streak: number
          onboarding_completed: boolean
          position: string | null
          role: Database["public"]["Enums"]["user_role"]
          streak_days: number
          updated_at: string
          username: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          full_name?: string | null
          id: string
          is_approved?: boolean
          last_login_at?: string | null
          level?: number
          longest_streak?: number
          onboarding_completed?: boolean
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          streak_days?: number
          updated_at?: string
          username?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          full_name?: string | null
          id?: string
          is_approved?: boolean
          last_login_at?: string | null
          level?: number
          longest_streak?: number
          onboarding_completed?: boolean
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          streak_days?: number
          updated_at?: string
          username?: string | null
          xp?: number
        }
        Relationships: []
      }
      system_prompts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          prompt_key: string
          prompt_text: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          prompt_key: string
          prompt_text: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          prompt_key?: string
          prompt_text?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "system_prompts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      upvotes: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      usecase_evaluations: {
        Row: {
          ai_provider_used: string | null
          company_value_score: number | null
          created_at: string
          employee_value_score: number | null
          evaluated_by: string | null
          evaluator_type: Database["public"]["Enums"]["evaluator_type"]
          feasibility_score: number | null
          id: string
          idea_id: string
          innovation_score: number | null
          next_steps: string | null
          overall_score: number
          recommendation: string | null
          risks: string | null
          roi_estimate: string | null
          scalability_score: number | null
          strengths: string | null
        }
        Insert: {
          ai_provider_used?: string | null
          company_value_score?: number | null
          created_at?: string
          employee_value_score?: number | null
          evaluated_by?: string | null
          evaluator_type?: Database["public"]["Enums"]["evaluator_type"]
          feasibility_score?: number | null
          id?: string
          idea_id: string
          innovation_score?: number | null
          next_steps?: string | null
          overall_score: number
          recommendation?: string | null
          risks?: string | null
          roi_estimate?: string | null
          scalability_score?: number | null
          strengths?: string | null
        }
        Update: {
          ai_provider_used?: string | null
          company_value_score?: number | null
          created_at?: string
          employee_value_score?: number | null
          evaluated_by?: string | null
          evaluator_type?: Database["public"]["Enums"]["evaluator_type"]
          feasibility_score?: number | null
          id?: string
          idea_id?: string
          innovation_score?: number | null
          next_steps?: string | null
          overall_score?: number
          recommendation?: string | null
          risks?: string | null
          roi_estimate?: string | null
          scalability_score?: number | null
          strengths?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usecase_evaluations_evaluated_by_fkey"
            columns: ["evaluated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usecase_evaluations_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          notified: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          notified?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          notified?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          joined_at: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          joined_at?: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          joined_at?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "active_challenges_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_progress: {
        Row: {
          certificate_id: string | null
          completed_at: string | null
          completed_lessons: number[] | null
          course_id: string
          progress_percent: number
          started_at: string
          user_id: string
        }
        Insert: {
          certificate_id?: string | null
          completed_at?: string | null
          completed_lessons?: number[] | null
          course_id: string
          progress_percent?: number
          started_at?: string
          user_id: string
        }
        Update: {
          certificate_id?: string | null
          completed_at?: string | null
          completed_lessons?: number[] | null
          course_id?: string
          progress_percent?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_learning_path_progress: {
        Row: {
          completed_at: string | null
          current_course_index: number
          id: string
          learning_path_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_course_index?: number
          id?: string
          learning_path_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_course_index?: number
          id?: string
          learning_path_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_path_progress_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_learning_path_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          completed_at: string
          lesson_id: string
          quiz_score: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          lesson_id: string
          quiz_score?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string
          lesson_id?: string
          quiz_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_challenges_view: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string | null
          is_active: boolean | null
          max_participants: number | null
          participant_count: number | null
          start_date: string | null
          title: string | null
          type: Database["public"]["Enums"]["challenge_type"] | null
          xp_reward: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_ai_costs_view: {
        Row: {
          display_name: string | null
          feature: Database["public"]["Enums"]["ai_feature_type"] | null
          month: string | null
          provider_key: string | null
          request_count: number | null
          total_cost: number | null
          total_tokens_input: number | null
          total_tokens_output: number | null
        }
        Relationships: []
      }
      trending_best_practices_view: {
        Row: {
          author_avatar: string | null
          author_id: string | null
          author_name: string | null
          category: Database["public"]["Enums"]["best_practice_category"] | null
          comments_count: number | null
          created_at: string | null
          excerpt: string | null
          id: string | null
          title: string | null
          trending_score: number | null
          upvotes_count: number | null
          views_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "best_practices_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      award_xp: {
        Args: { target_user_id: string; xp_amount: number }
        Returns: {
          leveled_up: boolean
          new_level: number
          new_xp: number
        }[]
      }
      cleanup_expired_chat_messages: { Args: never; Returns: number }
      generate_page_briefing: {
        Args: { p_page_context: string; p_user_id: string }
        Returns: string
      }
      get_active_provider_keys: {
        Args: never
        Returns: {
          api_key: string
          provider_key: string
        }[]
      }
      get_leaderboard: {
        Args: { limit_count?: number; offset_count?: number }
        Returns: {
          avatar_url: string
          badge_count: number
          full_name: string
          level: number
          rank: number
          user_id: string
          xp: number
        }[]
      }
      get_leaderboard_optimized: {
        Args: { current_user_id?: string; limit_count?: number }
        Returns: Json
      }
      get_mentor_signals: {
        Args: { p_limit?: number; p_page_context?: string; p_user_id: string }
        Returns: {
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_dismissed: boolean
          is_read: boolean
          metadata: Json | null
          page_context: string
          priority: number
          shown_at: string | null
          signal_type: string
          title: string | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "mentor_signals"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_profile_data: { Args: { target_user_id: string }; Returns: Json }
      increment_field: {
        Args: {
          field_name: string
          increment_by?: number
          row_id: string
          table_name: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_moderator_or_above: { Args: never; Returns: boolean }
      match_best_practices: {
        Args: {
          filter_category?: string
          filter_difficulty?: string
          filter_tags?: string[]
          match_count?: number
          match_offset?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          ai_tags: string[]
          author_avatar: string
          author_id: string
          author_name: string
          category: Database["public"]["Enums"]["best_practice_category"]
          comments_count: number
          content: string
          created_at: string
          difficulty: string
          excerpt: string
          id: string
          similarity: number
          tags: string[]
          title: string
          upvotes_count: number
          views_count: number
        }[]
      }
      match_best_practices_count: {
        Args: {
          filter_category?: string
          filter_difficulty?: string
          filter_tags?: string[]
          match_threshold?: number
          query_embedding: string
        }
        Returns: number
      }
      search_best_practices: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: Database["public"]["Enums"]["best_practice_category"]
          excerpt: string
          id: string
          similarity: number
          title: string
        }[]
      }
      update_login_streak: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      upsert_provider_vault_key: {
        Args: { p_api_key: string; p_provider_key: string }
        Returns: string
      }
    }
    Enums: {
      achievement_category: "learning" | "community" | "engagement" | "mastery"
      achievement_requirement_type:
        | "xp_total"
        | "posts_count"
        | "comments_count"
        | "courses_completed"
        | "login_streak"
        | "lessons_completed"
        | "upvotes_received"
        | "badges_earned"
      ai_feature_type:
        | "mentor_chat"
        | "usecase_eval"
        | "search"
        | "auto_tag"
        | "summary"
      badge_category: "achievement" | "skill" | "social" | "special"
      best_practice_category:
        | "prompt_engineering"
        | "ai_tools"
        | "automation"
        | "data_analysis"
        | "ai_ethics"
        | "other"
      challenge_type: "weekly" | "monthly" | "special"
      chat_message_role: "user" | "assistant" | "system"
      community_post_type:
        | "discussion"
        | "idea"
        | "show_and_tell"
        | "question"
        | "challenge"
      content_status: "draft" | "published" | "archived"
      difficulty_level: "beginner" | "intermediate" | "advanced" | "expert"
      entity_type: "best_practice" | "community_post"
      evaluator_type: "ai" | "human"
      lesson_type: "text" | "video" | "quiz" | "interactive"
      notification_type:
        | "achievement"
        | "comment"
        | "like"
        | "challenge"
        | "system"
        | "mention"
      radar_category: "tools" | "techniques" | "platforms" | "frameworks"
      radar_ring: "adopt" | "trial" | "assess" | "hold"
      trend_direction: "rising" | "stable" | "declining"
      user_role: "user" | "moderator" | "admin" | "super_admin"
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
      achievement_category: ["learning", "community", "engagement", "mastery"],
      achievement_requirement_type: [
        "xp_total",
        "posts_count",
        "comments_count",
        "courses_completed",
        "login_streak",
        "lessons_completed",
        "upvotes_received",
        "badges_earned",
      ],
      ai_feature_type: [
        "mentor_chat",
        "usecase_eval",
        "search",
        "auto_tag",
        "summary",
      ],
      badge_category: ["achievement", "skill", "social", "special"],
      best_practice_category: [
        "prompt_engineering",
        "ai_tools",
        "automation",
        "data_analysis",
        "ai_ethics",
        "other",
      ],
      challenge_type: ["weekly", "monthly", "special"],
      chat_message_role: ["user", "assistant", "system"],
      community_post_type: [
        "discussion",
        "idea",
        "show_and_tell",
        "question",
        "challenge",
      ],
      content_status: ["draft", "published", "archived"],
      difficulty_level: ["beginner", "intermediate", "advanced", "expert"],
      entity_type: ["best_practice", "community_post"],
      evaluator_type: ["ai", "human"],
      lesson_type: ["text", "video", "quiz", "interactive"],
      notification_type: [
        "achievement",
        "comment",
        "like",
        "challenge",
        "system",
        "mention",
      ],
      radar_category: ["tools", "techniques", "platforms", "frameworks"],
      radar_ring: ["adopt", "trial", "assess", "hold"],
      trend_direction: ["rising", "stable", "declining"],
      user_role: ["user", "moderator", "admin", "super_admin"],
    },
  },
} as const
