import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SubscriptionOverlayCheckout from '../components/SubscriptionOverlayCheckout';
import { useAuth, Profile } from '../stores/AuthStore';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';

// Define the subscription plans
const SUBSCRIPTION_PLANS = [
  {
    id: 'pdt_free_plan',
    name: 'Free',
    description: 'Basic access with limited features',
    price: 0,
    features: [
      '10 keyword generations per month',
      'Basic templates',
      'Email support'
    ]
  },
  {
    id: 'pdt_basic_plan',
    name: 'Basic',
    description: 'Great for growing businesses',
    price: 9.99,
    features: [
      '100 keyword generations per month',
      'All templates',
      'Priority email support',
      'Export to CSV/Excel'
    ],
    isPopular: true
  },
  {
    id: 'pdt_unlimited_plan',
    name: 'Unlimited',
    description: 'For power users and teams',
    price: 29.99,
    features: [
      'Unlimited keyword generations',
      'Advanced analytics',
      'Premium templates',
      'API access',
      'Dedicated support',
      'Team collaboration features'
    ]
  }
];

const SubscriptionPage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/login', { state: { from: '/subscription' } });
      return;
    }

    // Set current plan from profile
    if (profile) {
      setCurrentPlan(profile.subscription_plan || 'free');
    }
  }, [user, profile, navigate]);

  const handleSubscriptionSuccess = async (data: any) => {
    setLoading(true);
    try {
      // Refresh the user profile to get updated subscription info
      await refreshProfile();
      
      // Show success message
      toast({
        title: 'Subscription Updated!',
        description: 'Your subscription has been successfully updated.',
        type: 'success',
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error handling subscription success:', error);
      toast({
        title: 'Error',
        description: 'There was an error updating your subscription information.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      // Fetch the customer portal URL from your backend
      const { data, error } = await supabase.functions.invoke('get-customer-portal', {
        body: { customer_id: user?.id }
      });
      
      if (error) throw error;
      
      // Redirect to the customer portal
      window.location.href = data.url;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: 'Error',
        description: 'Could not open the subscription management portal.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Subscription Plans</h1>
          <p className="text-lg text-gray-600">
            Choose the plan that works best for your needs
          </p>
        </div>

        {profile?.subscription_status === 'active' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 text-center">
            <p className="text-green-800">
              You are currently on the <span className="font-bold">{currentPlan?.toUpperCase()}</span> plan.
            </p>
            <button
              onClick={handleManageSubscription}
              disabled={loading}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              {loading ? 'Loading...' : 'Manage Subscription'}
            </button>
          </div>
        )}

        <SubscriptionOverlayCheckout
          mode={process.env.NODE_ENV === 'production' ? 'live' : 'test'}
          plans={SUBSCRIPTION_PLANS}
          onSuccess={handleSubscriptionSuccess}
          redirectUrl={`${window.location.origin}/subscription-success`}
        />
      </div>
    </div>
  );
};

export default SubscriptionPage;
