export type Database = {
  public: {
    Tables: {
      vcx_members: {
        Relationships: []
        Row: {
          id: string
          name: string
          email: string
          current_company: string | null
          title: string | null
          professional_fields: string[]
          years_of_experience: number | null
          bio: string | null
          linkedin_url: string | null
          member_tier: 'core' | 'endorsed'
          system_role: 'super_admin' | 'admin' | 'member'
          join_date: string
          endorsed_by: string | null
          endorsed_by_name: string | null
          avatar_url: string | null
          industry: string | null
          location: string | null
          is_open_to_chat: boolean
          profile_visibility: 'members_only' | 'corporate_only' | 'all'
          is_active: boolean
          fts: unknown | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          current_company?: string | null
          title?: string | null
          professional_fields?: string[]
          years_of_experience?: number | null
          bio?: string | null
          linkedin_url?: string | null
          member_tier: 'core' | 'endorsed'
          system_role?: 'super_admin' | 'admin' | 'member'
          join_date?: string
          endorsed_by?: string | null
          endorsed_by_name?: string | null
          avatar_url?: string | null
          industry?: string | null
          location?: string | null
          is_open_to_chat?: boolean
          profile_visibility?: 'members_only' | 'corporate_only' | 'all'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          email?: string
          current_company?: string | null
          title?: string | null
          professional_fields?: string[]
          years_of_experience?: number | null
          bio?: string | null
          linkedin_url?: string | null
          member_tier?: 'core' | 'endorsed'
          system_role?: 'super_admin' | 'admin' | 'member'
          endorsed_by?: string | null
          endorsed_by_name?: string | null
          avatar_url?: string | null
          industry?: string | null
          location?: string | null
          is_open_to_chat?: boolean
          profile_visibility?: 'members_only' | 'corporate_only' | 'all'
          is_active?: boolean
          updated_at?: string
        }
      }
      vcx_invites: {
        Relationships: []
        Row: {
          id: string
          email: string
          invited_by: string
          invited_by_name: string
          member_tier: 'core' | 'endorsed'
          status: 'pending' | 'accepted' | 'expired' | 'revoked'
          token_hash: string
          expires_at: string
          accepted_at: string | null
          recommendation_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          invited_by: string
          invited_by_name: string
          member_tier: 'core' | 'endorsed'
          status?: 'pending' | 'accepted' | 'expired' | 'revoked'
          token_hash: string
          expires_at: string
          accepted_at?: string | null
          recommendation_id?: string | null
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'expired' | 'revoked'
          accepted_at?: string | null
        }
      }
      vcx_corporate_users: {
        Relationships: []
        Row: {
          id: string
          name: string
          email: string
          company: string
          role: 'ceo' | 'founder' | 'c_level' | 'hr_leader'
          title: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          company: string
          role: 'ceo' | 'founder' | 'c_level' | 'hr_leader'
          title?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          email?: string
          company?: string
          role?: 'ceo' | 'founder' | 'c_level' | 'hr_leader'
          title?: string | null
          is_verified?: boolean
          updated_at?: string
        }
      }
      vcx_recommendations: {
        Relationships: []
        Row: {
          id: string
          recommender_id: string
          recommended_email: string
          recommended_name: string
          reason: string | null
          member_tier: 'core' | 'endorsed'
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recommender_id: string
          recommended_email: string
          recommended_name: string
          reason?: string | null
          member_tier: 'core' | 'endorsed'
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
      }
      vcx_ceo_coffee_sessions: {
        Relationships: [
          {
            foreignKeyName: 'vcx_ceo_coffee_sessions_host_id_fkey'
            columns: ['host_id']
            isOneToOne: false
            referencedRelation: 'vcx_corporate_users'
            referencedColumns: ['id']
          }
        ]
        Row: {
          id: string
          host_id: string
          title: string
          description: string
          session_date: string
          duration_minutes: number
          max_participants: number
          location_type: 'online' | 'offline' | 'hybrid'
          location_detail: string | null
          status: 'open' | 'closed' | 'completed' | 'cancelled'
          target_tier: 'core' | 'endorsed' | 'all' | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_id: string
          title: string
          description: string
          session_date: string
          duration_minutes?: number
          max_participants?: number
          location_type: 'online' | 'offline' | 'hybrid'
          location_detail?: string | null
          status?: 'open' | 'closed' | 'completed' | 'cancelled'
          target_tier?: 'core' | 'endorsed' | 'all' | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          session_date?: string
          duration_minutes?: number
          max_participants?: number
          location_type?: 'online' | 'offline' | 'hybrid'
          location_detail?: string | null
          status?: 'open' | 'closed' | 'completed' | 'cancelled'
          target_tier?: 'core' | 'endorsed' | 'all' | null
          tags?: string[]
          updated_at?: string
        }
      }
      vcx_coffee_applications: {
        Relationships: [
          {
            foreignKeyName: 'vcx_coffee_applications_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'vcx_ceo_coffee_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vcx_coffee_applications_applicant_id_fkey'
            columns: ['applicant_id']
            isOneToOne: false
            referencedRelation: 'vcx_members'
            referencedColumns: ['id']
          }
        ]
        Row: {
          id: string
          session_id: string
          applicant_id: string
          message: string | null
          status: 'pending' | 'accepted' | 'rejected'
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          applicant_id: string
          message?: string | null
          status?: 'pending' | 'accepted' | 'rejected'
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'rejected'
          reviewed_at?: string | null
        }
      }
      vcx_notifications: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body?: string | null
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
      }
      positions: {
        Relationships: []
        Row: {
          id: string
          company_name: string
          title: string
          team_size: string | null
          role_description: string
          salary_range: string | null
          status: 'active' | 'closed' | 'draft'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          title: string
          team_size?: string | null
          role_description: string
          salary_range?: string | null
          status?: 'active' | 'closed' | 'draft'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          title?: string
          team_size?: string | null
          role_description?: string
          salary_range?: string | null
          status?: 'active' | 'closed' | 'draft'
          updated_at?: string
        }
      }
      position_interests: {
        Relationships: []
        Row: {
          id: string
          position_id: string
          user_id: string
          interest_type: 'interested' | 'not_interested' | 'bookmark'
          created_at: string
        }
        Insert: {
          id?: string
          position_id: string
          user_id: string
          interest_type: 'interested' | 'not_interested' | 'bookmark'
          created_at?: string
        }
        Update: {
          interest_type?: 'interested' | 'not_interested' | 'bookmark'
        }
      }
      peer_coffee_chats: {
        Relationships: []
        Row: {
          id: string
          author_id: string
          title: string
          content: string
          category: 'general' | 'career' | 'hiring' | 'mentoring'
          status: 'open' | 'matched' | 'closed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          content: string
          category?: 'general' | 'career' | 'hiring' | 'mentoring'
          status?: 'open' | 'matched' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          content?: string
          category?: 'general' | 'career' | 'hiring' | 'mentoring'
          status?: 'open' | 'matched' | 'closed'
          updated_at?: string
        }
      }
      peer_coffee_applications: {
        Relationships: []
        Row: {
          id: string
          chat_id: string
          applicant_id: string
          message: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          applicant_id: string
          message: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'rejected'
        }
      }
      community_posts: {
        Relationships: []
        Row: {
          id: string
          author_id: string
          category: 'career' | 'leadership' | 'salary' | 'burnout' | 'productivity' | 'company_review'
          title: string
          content: string
          is_anonymous: boolean
          status: 'active' | 'hidden' | 'deleted'
          created_at: string
          updated_at: string
          likes_count: number
          comments_count: number
        }
        Insert: {
          id?: string
          author_id: string
          category: 'career' | 'leadership' | 'salary' | 'burnout' | 'productivity' | 'company_review'
          title: string
          content: string
          is_anonymous?: boolean
          status?: 'active' | 'hidden' | 'deleted'
          created_at?: string
          updated_at?: string
          likes_count?: number
          comments_count?: number
        }
        Update: {
          category?: 'career' | 'leadership' | 'salary' | 'burnout' | 'productivity' | 'company_review'
          title?: string
          content?: string
          is_anonymous?: boolean
          status?: 'active' | 'hidden' | 'deleted'
          updated_at?: string
          likes_count?: number
          comments_count?: number
        }
      }
      community_comments: {
        Relationships: []
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          is_anonymous: boolean
          status: 'active' | 'hidden' | 'deleted'
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          is_anonymous?: boolean
          status?: 'active' | 'hidden' | 'deleted'
          created_at?: string
        }
        Update: {
          content?: string
          is_anonymous?: boolean
          status?: 'active' | 'hidden' | 'deleted'
        }
      }
      community_reports: {
        Relationships: []
        Row: {
          id: string
          reporter_id: string
          post_id: string | null
          comment_id: string | null
          reason: string
          status: 'pending' | 'reviewed' | 'action_taken'
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          post_id?: string | null
          comment_id?: string | null
          reason: string
          status?: 'pending' | 'reviewed' | 'action_taken'
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'reviewed' | 'action_taken'
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      vcx_is_member: {
        Args: { user_id: string }
        Returns: boolean
      }
      vcx_is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      vcx_is_core_member: {
        Args: { user_id: string }
        Returns: boolean
      }
      vcx_coffee_application_count: {
        Args: { p_session_id: string }
        Returns: number
      }
      vcx_consume_invite: {
        Args: { p_token_hash: string }
        Returns: Array<{
          id: string
          email: string
          invited_by: string
          invited_by_name: string
          member_tier: 'core' | 'endorsed'
          recommendation_id: string | null
          expires_at: string
        }>
      }
      vcx_get_user_info: {
        Args: { p_user_id: string }
        Returns: {
          member: {
            system_role: 'super_admin' | 'admin' | 'member'
            member_tier: 'core' | 'endorsed'
            is_active: boolean
          } | null
          corporate: {
            role: 'ceo' | 'founder' | 'c_level' | 'hr_leader'
          } | null
        } | null
      }
    }
    Enums: Record<string, never>
  }
}
