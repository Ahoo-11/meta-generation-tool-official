import { create } from 'zustand';
import { ProcessingSession, ProcessedImage, UserStats } from '@/types/supabase';
import {
  getProcessingSessions,
  getProcessedImages,
  getUserStats
} from '@/services/historyService';

interface HistoryState {
  // Sessions
  sessions: ProcessingSession[];
  isLoadingSessions: boolean;
  sessionsPage: number;
  sessionsLimit: number;
  hasMoreSessions: boolean;
  
  // Images for selected session
  selectedSessionId: string | null;
  selectedSessionImages: ProcessedImage[];
  isLoadingImages: boolean;
  imagesPage: number;
  imagesLimit: number;
  hasMoreImages: boolean;
  
  // User stats
  userStats: UserStats | null;
  isLoadingStats: boolean;
  
  // Actions
  fetchSessions: () => Promise<void>;
  fetchMoreSessions: () => Promise<void>;
  selectSession: (sessionId: string) => Promise<void>;
  fetchSessionImages: (sessionId: string) => Promise<void>;
  fetchMoreImages: () => Promise<void>;
  fetchUserStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  // Sessions
  sessions: [],
  isLoadingSessions: false,
  sessionsPage: 0,
  sessionsLimit: 10,
  hasMoreSessions: true,
  
  // Images for selected session
  selectedSessionId: null,
  selectedSessionImages: [],
  isLoadingImages: false,
  imagesPage: 0,
  imagesLimit: 50,
  hasMoreImages: true,
  
  // User stats
  userStats: null,
  isLoadingStats: false,
  
  // Fetch initial sessions
  fetchSessions: async () => {
    const { sessionsLimit } = get();
    
    set({ isLoadingSessions: true });
    try {
      const sessions = await getProcessingSessions(sessionsLimit, 0);
      set({
        sessions,
        sessionsPage: 0,
        hasMoreSessions: sessions.length === sessionsLimit,
        isLoadingSessions: false
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
      set({ isLoadingSessions: false });
    }
  },
  
  // Fetch more sessions (pagination)
  fetchMoreSessions: async () => {
    const { sessionsPage, sessionsLimit, sessions, hasMoreSessions, isLoadingSessions } = get();
    
    if (!hasMoreSessions || isLoadingSessions) return;
    
    set({ isLoadingSessions: true });
    try {
      const nextPage = sessionsPage + 1;
      const offset = nextPage * sessionsLimit;
      const newSessions = await getProcessingSessions(sessionsLimit, offset);
      
      set({
        sessions: [...sessions, ...newSessions],
        sessionsPage: nextPage,
        hasMoreSessions: newSessions.length === sessionsLimit,
        isLoadingSessions: false
      });
    } catch (error) {
      console.error('Error fetching more sessions:', error);
      set({ isLoadingSessions: false });
    }
  },
  
  // Select a session and fetch its images
  selectSession: async (sessionId: string) => {
    set({
      selectedSessionId: sessionId,
      selectedSessionImages: [],
      imagesPage: 0,
      hasMoreImages: true
    });
    
    await get().fetchSessionImages(sessionId);
  },
  
  // Fetch images for a session
  fetchSessionImages: async (sessionId: string) => {
    const { imagesLimit } = get();
    
    set({ isLoadingImages: true });
    try {
      const images = await getProcessedImages(sessionId, imagesLimit, 0);
      set({
        selectedSessionImages: images,
        imagesPage: 0,
        hasMoreImages: images.length === imagesLimit,
        isLoadingImages: false
      });
    } catch (error) {
      console.error('Error fetching session images:', error);
      set({ isLoadingImages: false });
    }
  },
  
  // Fetch more images for the selected session (pagination)
  fetchMoreImages: async () => {
    const {
      selectedSessionId,
      imagesPage,
      imagesLimit,
      selectedSessionImages,
      hasMoreImages,
      isLoadingImages
    } = get();
    
    if (!selectedSessionId || !hasMoreImages || isLoadingImages) return;
    
    set({ isLoadingImages: true });
    try {
      const nextPage = imagesPage + 1;
      const offset = nextPage * imagesLimit;
      const newImages = await getProcessedImages(selectedSessionId, imagesLimit, offset);
      
      set({
        selectedSessionImages: [...selectedSessionImages, ...newImages],
        imagesPage: nextPage,
        hasMoreImages: newImages.length === imagesLimit,
        isLoadingImages: false
      });
    } catch (error) {
      console.error('Error fetching more images:', error);
      set({ isLoadingImages: false });
    }
  },
  
  // Fetch user statistics
  fetchUserStats: async () => {
    set({ isLoadingStats: true });
    try {
      const stats = await getUserStats();
      set({
        userStats: stats,
        isLoadingStats: false
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      set({ isLoadingStats: false });
    }
  },
  
  // Refresh all data
  refreshAll: async () => {
    const { selectedSessionId } = get();
    
    await Promise.all([
      get().fetchSessions(),
      get().fetchUserStats(),
      selectedSessionId ? get().fetchSessionImages(selectedSessionId) : Promise.resolve()
    ]);
  }
}));
