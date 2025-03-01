export type ApiProvider = 'gemini' | 'openrouter';

export interface ApiConfig {
  provider: ApiProvider;
  modelName: string;
}

export const API_PROVIDERS: Record<ApiProvider, ApiConfig> = {
  gemini: {
    provider: 'gemini',
    modelName: 'gemini-pro-vision'
  },
  openrouter: {
    provider: 'openrouter',
    modelName: 'google/gemini-pro-vision' // OpenRouter's model name for Gemini
  }
};

// Default provider - read from env if available, otherwise use OpenRouter
const envDefaultProvider = import.meta.env.VITE_DEFAULT_PROVIDER?.toLowerCase();
export const DEFAULT_PROVIDER: ApiProvider = 
  (envDefaultProvider === 'gemini' || envDefaultProvider === 'openrouter') 
    ? envDefaultProvider as ApiProvider 
    : 'openrouter';
