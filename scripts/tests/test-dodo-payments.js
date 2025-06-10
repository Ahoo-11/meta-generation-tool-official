// Test script for Dodo Payments integration
import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'readline';

// Initialize Supabase client
const supabaseUrl = 'https://alywdwwqrtddplqsbksd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFseXdkd3dxcnRkZHBscXNia3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMjQyNTIsImV4cCI6MjA0OTYwMDI1Mn0.kiuDTgrGVi4rbZ3XYSIfqTTsiNUCvByDo5aDuXkwsZQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock payment data
const mockPaymentData = {
  id: `payment_${Date.now()}`,
  customerId: 'cus_test123',
  amount: 1000, // $10.00
  currency: 'USD',
  status: 'succeeded',
  metadata: {
    profile_id: '' // You'll need to fill this with your actual profile ID
  }
};

// Mock subscription data
const mockSubscriptionData = {
  id: `sub_${Date.now()}`,
  customerId: 'cus_test123',
  status: 'active',
  currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
  currentPeriodStart: Date.now(),
  cancelAtPeriodEnd: false,
  priceId: 'price_basic',
  quantity: 1,
  metadata: {
    profile_id: '', // You'll need to fill this with your actual profile ID
    plan_id: 'basic'
  }
};

// Calculate credits from payment amount
function calculateCreditsFromPayment(amount) {
  const dollars = amount / 100;
  return Math.floor(dollars * 10);
}

// Simulate payment success
async function simulatePaymentSuccess(data) {
  try {
    console.log('Simulating payment success with data:', data);
    
    // Add credits to the user's profile
    const { error } = await supabase.rpc('add_credits', {
      user_id: data.metadata.profile_id,
      amount: calculateCreditsFromPayment(data.amount),
      description: `Test payment ${data.id}`
    });
    
    if (error) {
      console.error('Error updating profile credits:', error);
      return false;
    }
    
    console.log(`Successfully added ${calculateCreditsFromPayment(data.amount)} credits to profile ${data.metadata.profile_id}`);
    return true;
  } catch (error) {
    console.error('Error simulating payment:', error);
    return false;
  }
}

// Simulate subscription creation
async function simulateSubscriptionCreation(data) {
  try {
    console.log('Simulating subscription creation with data:', data);
    
    // Update the profile with subscription information
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_id: data.id,
        customer_id: data.customerId,
        subscription_plan: data.metadata.plan_id || 'basic',
        billing_cycle_start: new Date(data.currentPeriodStart).toISOString(),
        billing_cycle_end: new Date(data.currentPeriodEnd).toISOString(),
        payment_status: data.status
      })
      .eq('id', data.metadata.profile_id);
    
    if (error) {
      console.error('Error updating profile subscription:', error);
      return false;
    }
    
    // Get plan credits
    const planCredits = getPlanCredits(data.metadata.plan_id);
    
    // Add subscription credits
    if (planCredits > 0) {
      const { error: creditError } = await supabase.rpc('add_credits', {
        user_id: data.metadata.profile_id,
        amount: planCredits,
        description: `Test subscription credits: ${data.metadata.plan_id} plan`
      });
      
      if (creditError) {
        console.error('Error adding subscription credits:', creditError);
        return false;
      }
    }
    
    console.log(`Successfully created subscription for profile ${data.metadata.profile_id}`);
    return true;
  } catch (error) {
    console.error('Error simulating subscription:', error);
    return false;
  }
}

// Get plan credits
function getPlanCredits(planId) {
  switch (planId) {
    case 'basic':
      return 1000;
    case 'pro':
      return 5000;
    case 'unlimited':
      return 50000;
    default:
      return 0;
  }
}

// Get the current user's profile ID
async function getCurrentProfileId() {
  try {
    // First try to get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('Found authenticated user:', user.email);
      return user.id;
    }
    
    // If no authenticated user, let the user input a profile ID
    console.log('No authenticated user found. You can enter a profile ID manually.');
    
    // Get the first profile from the database as a fallback
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return promptForProfileId();
    }
    
    if (profiles && profiles.length > 0) {
      const profileId = profiles[0].id;
      console.log(`Using first profile found in database: ${profileId}`);
      return profileId;
    }
    
    return promptForProfileId();
  } catch (error) {
    console.error('Error getting profile ID:', error);
    return promptForProfileId();
  }
}

// Prompt the user to enter a profile ID
function promptForProfileId() {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Enter a profile ID to use for testing: ', (answer) => {
      rl.close();
      if (answer.trim()) {
        resolve(answer.trim());
      } else {
        console.log('Using default test profile ID');
        resolve('00000000-0000-0000-0000-000000000000'); // Fallback default ID
      }
    });
  });
}

// Main function
async function runTest() {
  // Get the current profile ID
  const profileId = await getCurrentProfileId();
  if (!profileId) {
    console.error('Could not get profile ID. Please try again and enter a valid profile ID.');
    return;
  }
  
  // Set the profile ID in the mock data
  mockPaymentData.metadata.profile_id = profileId;
  mockSubscriptionData.metadata.profile_id = profileId;
  
  console.log(`Using profile ID: ${profileId}`);
  
  // Ask what to test
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('What would you like to test? (1: One-time payment, 2: Subscription): ', async (answer) => {
    if (answer === '1') {
      const success = await simulatePaymentSuccess(mockPaymentData);
      console.log(success ? 'Payment test completed successfully!' : 'Payment test failed.');
    } else if (answer === '2') {
      const success = await simulateSubscriptionCreation(mockSubscriptionData);
      console.log(success ? 'Subscription test completed successfully!' : 'Subscription test failed.');
    } else {
      console.log('Invalid option. Please run the script again and select 1 or 2.');
    }
    
    readline.close();
  });
}

// Run the test
runTest();
