import { create } from 'zustand';
import { refreshProfile } from '@/services/uploadService';

export interface Profile {
  username: string | null;
  email: string;
  credits: number;
  avatar_url: string | null;
}

interface ProfileStore {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  refreshProfile: () => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  refreshProfile: async () => {
    const updatedProfile = await refreshProfile();
    if (updatedProfile) {
      set({ profile: updatedProfile });
    }
  },
}));
