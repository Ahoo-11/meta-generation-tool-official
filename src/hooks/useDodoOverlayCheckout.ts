import { useState, useCallback, useEffect } from 'react';
import { DodoPayments } from 'dodopayments-checkout';
import { CheckoutEvent, CheckoutOptions } from '../components/DodoPaymentsOverlay';

interface UseDodoOverlayCheckoutOptions {
  mode: 'test' | 'live';
  theme?: 'light' | 'dark';
  onEvent?: (event: CheckoutEvent) => void;
  onSuccess?: (data: any) => void;
  onFailure?: (error: any) => void;
  onClose?: () => void;
}

interface CheckoutStatus {
  loading: boolean;
  paymentId?: string;
  success?: boolean;
  error?: any;
}

export function useDodoOverlayCheckout({
  mode,
  theme = 'light',
  onEvent,
  onSuccess,
  onFailure,
  onClose
}: UseDodoOverlayCheckoutOptions) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<CheckoutStatus>({ loading: false });

  useEffect(() => {
    if (!isInitialized) {
      try {
        DodoPayments.Initialize({
          mode,
          displayType: 'overlay',
          theme,
          linkType: 'dynamic',
          onEvent: (event: CheckoutEvent) => {
            // Pass all events to the custom handler
            if (onEvent) {
              onEvent(event);
            }

            // Handle specific events with our internal state
            switch (event.event_type) {
              case 'checkout.payment_created':
                setStatus({
                  loading: true,
                  paymentId: event.data?.paymentId
                });
                break;

              case 'checkout.payment_succeeded':
                setStatus({
                  loading: false,
                  paymentId: event.data?.paymentId,
                  success: true
                });
                if (onSuccess) onSuccess(event.data);
                break;

              case 'checkout.payment_failed':
                setStatus({
                  loading: false,
                  paymentId: event.data?.paymentId,
                  success: false,
                  error: event.error
                });
                if (onFailure) onFailure(event.error);
                break;

              case 'checkout.closed':
                if (onClose) onClose();
                break;

              default:
                break;
            }
          }
        });
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize DodoPayments SDK:', error);
      }
    }
  }, [isInitialized, mode, theme, onEvent, onSuccess, onFailure, onClose]);

  const openCheckout = useCallback((options: CheckoutOptions) => {
    if (!isInitialized) {
      console.error('DodoPayments SDK not initialized');
      return;
    }

    setStatus({ loading: true });
    DodoPayments.Checkout.open(options);
  }, [isInitialized]);

  const closeCheckout = useCallback(() => {
    if (!isInitialized) {
      console.error('DodoPayments SDK not initialized');
      return;
    }

    DodoPayments.Checkout.close();
  }, [isInitialized]);

  const resetStatus = useCallback(() => {
    setStatus({ loading: false });
  }, []);

  return {
    openCheckout,
    closeCheckout,
    resetStatus,
    status,
    isInitialized
  };
}

export default useDodoOverlayCheckout;
