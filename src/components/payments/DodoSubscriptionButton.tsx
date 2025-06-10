import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useProfileStore } from '@/stores/profileStore';
import { PaymentsAPI } from '@/integrations/dodo-payments/api';
import { BillingInterval } from '@/integrations/dodo-payments/types';

interface DodoSubscriptionButtonProps {
  planId: string;
  priceId: string;
  amount: number;
  currency?: string;
  billingInterval: BillingInterval;
  buttonText?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
  onSuccess?: (sessionId: string) => void;
  onError?: (error: Error) => void;
}

export function DodoSubscriptionButton({
  planId,
  priceId,
  amount,
  currency = 'USD',
  billingInterval,
  buttonText = 'Subscribe',
  buttonVariant = 'default',
  className = '',
  disabled = false,
  metadata = {},
  onSuccess,
  onError
}: DodoSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useProfileStore();
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!profile) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to subscribe',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare metadata with profile and subscription information
      const enhancedMetadata = {
        ...metadata,
        profile_id: profile.id,
        plan_id: planId,
        price_id: priceId,
        billing_interval: billingInterval,
        mode: 'subscription'
      };

      // Create checkout session for subscription
      const session = await PaymentsAPI.createCheckoutSession(
        amount,
        currency,
        profile.customer_id,
        window.location.origin + '/subscription-success',
        window.location.origin + '/subscription-cancel',
        enhancedMetadata
      );

      // Redirect to Dodo Payments checkout
      if (session?.url) {
        if (onSuccess) {
          onSuccess(session.id);
        }
        window.location.href = session.url;
      } else {
        throw new Error('Invalid checkout session');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Subscription processing failed';
      toast({
        title: 'Subscription Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Subscription error:', error);
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={buttonVariant}
      onClick={handleSubscribe}
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
  );
}
