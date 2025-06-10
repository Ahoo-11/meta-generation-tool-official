import { create } from 'zustand';
import { refreshProfile } from '@/services/uploadService';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  username: string | null;
  email: string;
  credits: number;
  avatar_url: string | null;
  subscription_plan?: string;
  monthly_credits?: number;
  permanent_credits?: number;
  id?: string;
  customer_id?: string;
  subscription_id?: string;
  billing_cycle_start?: number;
  billing_cycle_end?: number;
  payment_status?: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing';
}

interface ProfileStore {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  setProfile: (profile: Profile | null) => void;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile | null>;
  refreshProfile: () => Promise<void>;
  initializeProfile: () => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,
  setProfile: (profile) => set({ profile }),
  updateProfile: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const currentProfile = get().profile;
      if (!currentProfile || !currentProfile.id) {
        set({ isLoading: false, error: 'No profile to update' });
        return null;
      }

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentProfile.id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        set({ isLoading: false, error: error.message });
        return null;
      }

      if (updatedProfile) {
        set({ profile: updatedProfile, isLoading: false });
        return updatedProfile;
      } else {
        set({ isLoading: false, error: 'Failed to update profile' });
        return null;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      set({ isLoading: false, error: 'Error updating profile' });
      return null;
    }
  },
  refreshProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const updatedProfile = await refreshProfile();
      if (updatedProfile) {
        set({ profile: updatedProfile, isLoading: false });
        console.log('Profile updated in store:', updatedProfile);
      } else {
        set({ isLoading: false, error: 'Failed to refresh profile' });
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      set({ isLoading: false, error: 'Error refreshing profile' });
    }
  },
  initializeProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        set({ isLoading: false, error: error.message });
        return;
      }

      if (profile) {
        console.log('Profile initialized:', profile);
        set({ profile, isLoading: false });
      } else {
        set({ isLoading: false, error: 'Profile not found' });
      }
    } catch (error) {
      console.error('Error initializing profile:', error);
      set({ isLoading: false, error: 'Error initializing profile' });
    }
  }
}));
