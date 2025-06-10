import React, { useState, useEffect } from 'react';
import { useDodoOverlayCheckout } from '../hooks/useDodoOverlayCheckout';
import { useAuth } from '../stores/AuthStore';
import { useToast } from '../hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  isPopular?: boolean;
}

interface SubscriptionOverlayCheckoutProps {
  mode: 'test' | 'live';
  plans: SubscriptionPlan[];
  onSuccess?: (data: unknown) => void;
  redirectUrl?: string;
}

const SubscriptionOverlayCheckout: React.FC<SubscriptionOverlayCheckoutProps> = ({
  mode,
  plans,
  onSuccess,
  redirectUrl
}) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Get the URL of the current page for redirect
  const currentUrl = typeof window !== 'undefined' 
    ? window.location.href 
    : '';

  const {
    openCheckout,
    closeCheckout,
    resetStatus,
    status,
    isInitialized
  } = useDodoOverlayCheckout({
    mode,
    theme: 'light',
    onSuccess: (data) => {
      toast({
        title: 'Subscription Successful!',
        description: 'Your subscription has been activated.',
        variant: 'default',
      });
      
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onFailure: (error) => {
      toast({
        title: 'Payment Failed',
        description: error?.message || 'There was an issue processing your payment.',
        variant: 'destructive',
      });
    },
    onClose: () => {
      console.log('Checkout closed');
    }
  });

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
  };

  const handleCheckout = async () => {
    if (!selectedPlan) {
      toast({
        title: 'Please select a plan',
        description: 'You need to select a subscription plan to continue.',
        variant: 'default',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Login Required',
        description: 'You need to be logged in to subscribe.',
        variant: 'default',
      });
      return;
    }

    try {
      // Open the overlay checkout
      openCheckout({
        products: [
          {
            productId: selectedPlan.id,
            quantity: 1
          }
        ],
        redirectUrl: redirectUrl || currentUrl,
        queryParams: {
          customer_id: user.id,
          user_email: user.email || ''
        }
      });
    } catch (error) {
      console.error('Error initiating checkout:', error);
      toast({
        title: 'Checkout Error',
        description: 'Failed to initialize checkout. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="subscription-plans-container">
      <h2 className="text-2xl font-bold text-center mb-8">Choose Your Plan</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`
              p-6 rounded-lg border-2 transition-all
              ${selectedPlan?.id === plan.id ? 'border-primary bg-primary/5' : 'border-gray-200'}
              ${plan.isPopular ? 'transform md:-translate-y-2 shadow-lg' : ''}
            `}
          >
            {plan.isPopular && (
              <div className="bg-primary text-white text-xs font-bold uppercase py-1 px-2 rounded-full absolute -top-3 left-1/2 transform -translate-x-1/2">
                Most Popular
              </div>
            )}
            
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <div className="text-3xl font-bold my-4">
              ${plan.price}<span className="text-base font-normal text-gray-500">/month</span>
            </div>
            
            <p className="text-gray-500 mb-4">{plan.description}</p>
            
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handleSelectPlan(plan)}
              className={`
                w-full py-2 px-4 rounded-md font-medium transition-colors
                ${selectedPlan?.id === plan.id 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
              `}
            >
              {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <button
          onClick={handleCheckout}
          disabled={!selectedPlan || status.loading}
          className={`
            py-3 px-8 rounded-md font-medium text-white
            ${!selectedPlan || status.loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'}
          `}
        >
          {status.loading ? 'Processing...' : 'Subscribe Now'}
        </button>
      </div>
      
      {status.error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {status.error.message || 'An error occurred during payment processing.'}
        </div>
      )}
    </div>
  );
};

export default SubscriptionOverlayCheckout;
