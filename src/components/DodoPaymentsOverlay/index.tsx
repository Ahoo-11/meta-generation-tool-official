import React, { useEffect, useState } from 'react';
import { DodoPayments } from 'dodopayments-checkout';

export type CheckoutEventType = 
  | 'checkout.opened'
  | 'checkout.closed'
  | 'checkout.redirect'
  | 'checkout.payment_created'
  | 'checkout.payment_succeeded'
  | 'checkout.payment_failed'
  | 'error';

export interface CheckoutEvent {
  event_type: CheckoutEventType;
  data?: any;
  error?: {
    message: string;
    code: string;
  };
}

export interface DodoOverlayCheckoutProps {
  mode: 'test' | 'live';
  theme?: 'light' | 'dark';
  onEvent?: (event: CheckoutEvent) => void;
  onSuccess?: (data: any) => void;
  onFailure?: (error: any) => void;
  onClose?: () => void;
}

export interface CheckoutOptions {
  products?: Array<{
    productId: string;
    quantity: number;
  }>;
  paymentLink?: string;
  redirectUrl?: string;
  queryParams?: Record<string, string>;
}

const DodoOverlayCheckout: React.FC<DodoOverlayCheckoutProps> = ({
  mode,
  theme = 'light',
  onEvent,
  onSuccess,
  onFailure,
  onClose
}) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize the SDK when component mounts
    if (!isInitialized) {
      DodoPayments.Initialize({
        mode: mode,
        displayType: 'overlay',
        theme: theme,
        linkType: 'dynamic',
        onEvent: (event: CheckoutEvent) => {
          // Call the custom onEvent handler if provided
          if (onEvent) {
            onEvent(event);
          }

          // Handle specific events
          switch (event.event_type) {
            case 'checkout.payment_succeeded':
              if (onSuccess) onSuccess(event.data);
              break;
            case 'checkout.payment_failed':
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
    }
  }, [isInitialized, mode, theme, onEvent, onSuccess, onFailure, onClose]);

  // Expose methods to open checkout
  const openCheckout = (options: CheckoutOptions) => {
    if (!isInitialized) {
      console.error('DodoPayments SDK not initialized');
      return;
    }
    
    DodoPayments.Checkout.open(options);
  };

  // Expose method to close checkout
  const closeCheckout = () => {
    if (!isInitialized) {
      console.error('DodoPayments SDK not initialized');
      return;
    }
    
    DodoPayments.Checkout.close();
  };

  // Return null since this is just a wrapper component with no UI
  return null;
};

export { DodoPayments, DodoOverlayCheckout };
export default DodoOverlayCheckout;
