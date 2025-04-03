import { ApiProvider } from '@/types';

export const checkApiStatus = async (provider: ApiProvider): Promise<boolean> => {
  try {
    // Add your API health check logic here
    // For now, we'll assume the API is always available
    return true;
  } catch (error) {
    console.error(`Failed to check ${provider} API status:`, error);
    return false;
  }
}; 