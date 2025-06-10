import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePaymentStore } from '@/stores/paymentStore';
import { useToast } from '@/components/ui/use-toast';

interface PaymentButtonProps {
  amount: number;
  currency?: string;
  label?: string;
  metadata?: Record<string, unknown>;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function PaymentButton({
  amount,
  currency = 'USD',
  label = 'Pay Now',
  metadata = {},
  variant = 'default',
  size = 'default',
  className = '',
}: PaymentButtonProps) {
  const { createCheckoutSession, redirectToCheckout, isLoading, error } = usePaymentStore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const session = await createCheckoutSession(amount, currency, metadata);
      redirectToCheckout(session);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handlePayment}
      disabled={isLoading || isProcessing}
    >
      {isLoading || isProcessing ? 'Processing...' : label}
    </Button>
  );
}
