import { create } from 'zustand';
import { supabase } from '../integrations/supabase/client';
import { User } from '@supabase/supabase-js';

// Define the auth store state
interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

// Define the Profile type
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  username?: string;
  theme_preference?: string;
  credits?: number; // Legacy field
  credits_remaining?: number;
  credits_total?: number;
  permanent_credits?: number;
  subscription_id?: string;
  subscription_status?: string;
  subscription_plan?: string;
  subscription_current_period_end?: string;
  billing_cycle_start?: string;
  billing_cycle_end?: string;
  created_at: string;
  updated_at: string;
  customer_id?: string;
}

// Create the auth store
export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  error: null,

  // Initialize the auth store when it's first used
  init: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        set({ user: session.user });
        await get().refreshProfile();
      }
    } catch (error) {
      console.error('Error initializing auth store:', error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      set({ user: data.user });
      await get().refreshProfile();
    } catch (error) {
      console.error('Error signing in:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Sign up with email and password
  signUp: async (email, password, userData) => {
    try {
      set({ isLoading: true, error: null });
      
      // Register the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        set({ user: data.user });
        
        // Create the user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            customer_id: data.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (profileError) throw profileError;
        
        await get().refreshProfile();
      }
    } catch (error) {
      console.error('Error signing up:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Sign out
  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      set({ user: null, profile: null });
    } catch (error) {
      console.error('Error signing out:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresh the current user
  refreshUser: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      set({ user: data.user });
    } catch (error) {
      console.error('Error refreshing user:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // Refresh the user profile
  refreshProfile: async () => {
    try {
      const { user } = get();
      
      if (!user) {
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      set({ profile: data as Profile });
    } catch (error) {
      console.error('Error refreshing profile:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // Update the user profile
  updateProfile: async (updates) => {
    try {
      const { user } = get();
      
      if (!user) {
        throw new Error('No user logged in');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      set({ profile: data as Profile });
    } catch (error) {
      console.error('Error updating profile:', error);
      set({ error: error.message });
      throw error;
    }
  }
}));

// Initialize the auth store when imported
(() => {
  if (typeof window !== 'undefined') {
    // Only run in the browser
    useAuth.getState().init();

    // Set up auth state change listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      const store = useAuth.getState();
      
      if (event === 'SIGNED_IN' && session?.user) {
        store.refreshUser();
        store.refreshProfile();
      } else if (event === 'SIGNED_OUT') {
        store.signOut();
      }
    });
  }
})();
