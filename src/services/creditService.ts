import { supabase } from '@/integrations/supabase/client';
import type { Profile, CreditHistory, SubscriptionPlan } from '@/types/supabase';
import { toast } from '@/hooks/use-toast';

// Helper function to refresh profile
const refreshProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase.rpc('manage_profile', {
    user_id: user.id,
    action: 'refresh'
  });

  if (error) {
    console.error('Error refreshing profile:', error);
  }
};

// Get user's current credit balance
export const getCreditBalance = async (): Promise<{ monthly: number; permanent: number } | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc('manage_profile', {
    user_id: user.id,
    action: 'refresh'
  });

  if (error || !data) {
    console.error('Error getting credit balance:', error);
    return null;
  }

  return {
    monthly: data.credits,
    permanent: data.permanent_credits
  };
};

// Check if user has enough credits
export const checkCredits = async (requiredCredits: number): Promise<boolean> => {
  const balance = await getCreditBalance();
  if (!balance) return false;
  
  return (balance.monthly + balance.permanent) >= requiredCredits;
};

// Add credits (for dev testing or purchases)
export const addCredits = async (
  amount: number, 
  type: 'purchase' | 'dev_addition' = 'dev_addition',
  description: string = 'Development credit addition'
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // First ensure profile exists
  await supabase.rpc('manage_profile', {
    user_id: user.id,
    action: 'create'
  });

  const { data, error } = await supabase.rpc('add_credits', {
    user_id: user.id,
    amount,
    credit_type: type,
    description
  });

  if (error) {
    console.error('Error adding credits:', error);
    toast({
      title: "Error",
      description: "Failed to add credits. Please try again.",
      variant: "destructive"
    });
    return false;
  }

  // After successful addition, refresh the profile
  await refreshProfile();

  toast({
    title: "Credits Added",
    description: `${amount} credits have been added to your account.`
  });

  return true;
};

// Deduct credits for usage
export const deductCredits = async (
  amount: number, 
  description: string = 'Image processing'
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // First ensure profile exists
  await supabase.rpc('manage_profile', {
    user_id: user.id,
    action: 'create'
  });

  const { data, error } = await supabase.rpc('deduct_credits', {
    user_id: user.id,
    amount,
    description
  });

  if (error) {
    console.error('Error deducting credits:', error);
    toast({
      title: "Error",
      description: "Failed to deduct credits. Please try again.",
      variant: "destructive"
    });
    return false;
  }

  // After successful deduction, refresh the profile
  await refreshProfile();

  return true;
};

// Get credit history
export const getCreditHistory = async (): Promise<CreditHistory[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('credit_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching credit history:', error);
    return [];
  }

  return data || [];
};

// Get user's subscription plan
export const getUserPlan = async (): Promise<SubscriptionPlan | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc('manage_profile', {
    user_id: user.id,
    action: 'refresh'
  });

  if (error || !data) {
    console.error('Error getting user plan:', error);
    return null;
  }

  return data.subscription_plan;
};

// Update user's subscription plan (for testing)
export const updateUserPlan = async (plan: SubscriptionPlan): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc('manage_profile', {
    user_id: user.id,
    action: 'create',
    plan
  });

  if (error) {
    console.error('Error updating subscription plan:', error);
    return false;
  }

  return true;
};
