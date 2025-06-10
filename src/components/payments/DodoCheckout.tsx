import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useProfileStore } from '@/stores/profileStore';
import { PaymentsAPI, CustomersAPI } from '@/integrations/dodo-payments/api';

interface DodoCheckoutProps {
  amount: number;
  currency?: string;
  mode: 'payment' | 'subscription';
  priceId?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  metadata?: Record<string, unknown>;
  onSuccess?: (sessionId: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
}

export function DodoCheckout({
  amount,
  currency = 'USD',
  mode = 'payment',
  priceId,
  buttonText = 'Checkout',
  buttonVariant = 'default',
  metadata = {},
  onSuccess,
  onCancel,
  disabled = false,
  className = '',
}: DodoCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProfileStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Prepare success and cancel URLs
  const successUrl = window.location.origin + '/payment-success';
  const cancelUrl = window.location.origin + '/payment-cancel';

  const handleCheckout = async () => {
    if (!profile) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to continue with checkout',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Ensure we have a customer ID
      let customerId = profile.customer_id;
      
      if (!customerId) {
        // Create a new customer if one doesn't exist
        const customer = await CustomersAPI.createCustomer(
          profile.email || '',
          profile.username || '',
          { profile_id: profile.id }
        );
        customerId = customer.id;
        
        // Update profile with customer ID in the background
        useProfileStore.getState().updateProfile({
          customer_id: customerId
        });
      }

      // Create checkout session with enhanced metadata
      const enhancedMetadata = {
        ...metadata,
        profile_id: profile.id || '',
        email: profile.email || '',
        mode: mode
      };

      // Create checkout session
      const checkoutSession = await PaymentsAPI.createCheckoutSession(
        amount,
        currency,
        customerId,
        successUrl,
        cancelUrl,
        enhancedMetadata
      );
      
      // Redirect to Dodo Payments checkout
      if (checkoutSession?.url) {
        window.location.href = checkoutSession.url;
      } else {
        throw new Error('Invalid checkout session');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
      setError(errorMessage);
      toast({
        title: 'Checkout Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Checkout error:', error);
      
      if (onCancel) {
        onCancel();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={buttonVariant}
        onClick={handleCheckout}
        disabled={isLoading || disabled}
        className={className}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          buttonText
        )}
      </Button>
      
      {error && (
        <div className="mt-2 text-sm text-red-500">
          {error}
        </div>
      )}
    </>
  );
}
