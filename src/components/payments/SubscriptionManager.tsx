import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePaymentStore } from '@/stores/paymentStore';
import { useProfileStore } from '@/stores/profileStore';
import { Subscription } from '@/integrations/dodo-payments/types';
import { formatDate } from '@/lib/utils';

interface SubscriptionManagerProps {
  onSubscriptionChange?: (subscription: Subscription | null) => void;
}

export function SubscriptionManager({ onSubscriptionChange }: SubscriptionManagerProps) {
  const { 
    activeSubscription, 
    getActiveSubscription, 
    cancelSubscription, 
    isLoading, 
    error 
  } = usePaymentStore();
  
  const { profile } = useProfileStore();
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (profile?.customer_id) {
      getActiveSubscription().then(subscription => {
        if (onSubscriptionChange) {
          onSubscriptionChange(subscription);
        }
      });
    }
  }, [profile, getActiveSubscription, onSubscriptionChange]);

  const handleCancelSubscription = async () => {
    if (!activeSubscription) return;
    
    setIsCancelling(true);
    try {
      const success = await cancelSubscription(activeSubscription.id);
      if (success && onSubscriptionChange) {
        onSubscriptionChange(activeSubscription.cancelAtPeriodEnd ? activeSubscription : null);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-2">Loading subscription details...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!activeSubscription) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You don't have an active subscription plan.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isAlreadyCancelled = activeSubscription.cancelAtPeriodEnd;
  const endDate = new Date(activeSubscription.currentPeriodEnd * 1000);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Subscription</CardTitle>
        <CardDescription>
          Manage your current subscription plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Status:</span>
            <span className="flex items-center">
              {activeSubscription.status === 'active' && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                  Active
                </>
              )}
              {activeSubscription.status !== 'active' && activeSubscription.status}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Current period:</span>
            <span>
              {formatDate(new Date(activeSubscription.currentPeriodStart * 1000))} - {formatDate(endDate)}
            </span>
          </div>
          
          {isAlreadyCancelled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Subscription Cancelled</AlertTitle>
              <AlertDescription>
                Your subscription has been cancelled but will remain active until {formatDate(endDate)}.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {!isAlreadyCancelled && (
          <Button 
            variant="outline" 
            onClick={handleCancelSubscription}
            disabled={isCancelling}
            className="w-full"
          >
            {isCancelling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Subscription'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
