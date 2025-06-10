export type SubscriptionPlan = 'free' | 'basic' | 'unlimited';

export interface Profile {
  id: string;
  sequential_id: number;
  created_at: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  credits: number;
  permanent_credits: number;
  subscription_plan: SubscriptionPlan;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  billing_cycle_start: string | null;
  billing_cycle_end: string | null;
  monthly_credits: number;
}

export interface ProcessingSession {
  id: string;
  user_id: string;
  session_name: string;
  created_at: string;
  image_count: number;
  success_count: number;
  failure_count: number;
  credits_used: number;
  api_provider: string;
  expires_at: string;
}

export interface ProcessedImage {
  id: string;
  session_id: string;
  user_id: string;
  file_name: string;
  category: string | null;
  processing_time_ms: number | null;
  status: 'completed' | 'failed';
  keywords: string[];
  title: string | null;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface UserStats {
  user_id: string;
  total_images_processed: number;
  total_images_succeeded: number;
  total_images_failed: number;
  total_credits_used: number;
  monthly_images_processed: number;
  category_distribution: Record<string, number>;
  common_keywords: Record<string, number>;
  last_updated_at: string;
}

export interface CreditHistory {
  id: string;
  user_id: string;
  amount: number;
  type: 'monthly_refresh' | 'usage' | 'purchase' | 'dev_addition';
  description: string;
  created_at: string;
  expires_at: string | null;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'created_at'>>;
      };
      processing_sessions: {
        Row: ProcessingSession;
        Insert: Omit<ProcessingSession, 'id' | 'created_at' | 'expires_at'>;
        Update: Partial<Omit<ProcessingSession, 'id' | 'user_id' | 'created_at'>>;
      };
      processed_images: {
        Row: ProcessedImage;
        Insert: Omit<ProcessedImage, 'id' | 'created_at'>;
        Update: Partial<Omit<ProcessedImage, 'id' | 'user_id' | 'session_id' | 'created_at'>>;
      };
      user_stats: {
        Row: UserStats;
        Insert: Omit<UserStats, 'last_updated_at'>;
        Update: Partial<Omit<UserStats, 'user_id'>>;
      };
      credit_history: {
        Row: CreditHistory;
        Insert: Omit<CreditHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<CreditHistory, 'id' | 'user_id' | 'created_at'>>;
      };
    };
    Functions: {
      create_processing_session: {
        Args: {
          p_user_id: string;
          p_session_name: string;
          p_api_provider: string;
        };
        Returns: string;
      };
      update_session_stats: {
        Args: {
          p_session_id: string;
          p_success_count: number;
          p_failure_count: number;
          p_credits_used: number;
        };
        Returns: boolean;
      };
      record_processed_image: {
        Args: {
          p_session_id: string;
          p_user_id: string;
          p_file_name: string;
          p_category: string | null;
          p_processing_time_ms: number | null;
          p_status: 'completed' | 'failed';
          p_keywords: string[];
          p_title: string | null;
          p_description: string | null;
          p_metadata: Record<string, any>;
        };
        Returns: string;
      };
      manage_profile: {
        Args: {
          operation: 'add_credits' | 'deduct_credits';
          profile_id: string;
          credits_amount: number;
        };
        Returns: void;
      };
      log_subscription_event: {
        Args: {
          p_profile_id: string;
          p_subscription_id: string;
          p_event_type: string;
          p_previous_plan?: string;
          p_new_plan?: string;
          p_metadata?: Record<string, any>;
        };
        Returns: void;
      };
    };
  };
};
