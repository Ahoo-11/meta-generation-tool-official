import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useProfileStore } from '@/stores/profileStore';
import { PaymentsAPI } from '@/integrations/dodo-payments/api';

interface DodoPaymentButtonProps {
  amount: number;
  currency?: string;
  productName: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
  onSuccess?: (sessionId: string) => void;
  onError?: (error: Error) => void;
}

export function DodoPaymentButton({
  amount,
  currency = 'USD',
  productName,
  buttonText = 'Pay Now',
  buttonVariant = 'default',
  className = '',
  disabled = false,
  metadata = {},
  onSuccess,
  onError
}: DodoPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useProfileStore();
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!profile) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to make a payment',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare metadata with profile information
      const enhancedMetadata = {
        ...metadata,
        profile_id: profile.id,
        product_name: productName
      };

      // Create checkout session
      const session = await PaymentsAPI.createCheckoutSession(
        amount,
        currency,
        profile.customer_id,
        window.location.origin + '/payment-success',
        window.location.origin + '/payment-cancel',
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
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Payment error:', error);
      
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
      onClick={handlePayment}
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
