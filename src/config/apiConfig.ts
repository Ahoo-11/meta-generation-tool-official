export type ApiProvider = 'openrouter';

// API model configuration
export const API_CONFIG = {
  provider: 'openrouter' as ApiProvider,
    modelName: 'google/gemini-flash-1.5-8b'
};

// Default provider is always OpenRouter
export const DEFAULT_PROVIDER: ApiProvider = 'openrouter';
