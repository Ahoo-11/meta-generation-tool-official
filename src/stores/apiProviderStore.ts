import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiProvider, DEFAULT_PROVIDER } from '@/config/apiConfig';

interface ApiProviderState {
  currentProvider: ApiProvider;
  setProvider: (provider: ApiProvider) => void;
}

export const useApiProviderStore = create<ApiProviderState>()(
  persist(
    (set) => ({
      currentProvider: DEFAULT_PROVIDER,
      setProvider: (provider) => set({ currentProvider: provider }),
    }),
    {
      name: 'api-provider-storage',
    }
  )
);
