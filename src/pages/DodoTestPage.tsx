import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, CreditCard, Check, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useProfileStore } from '@/stores/profileStore';
import { PaymentsAPI, SubscriptionsAPI, CustomersAPI } from '@/integrations/dodo-payments/api';

// This page uses the real Dodo Payments API
export default function DodoTestPage() {
  const { profile } = useProfileStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string; url?: string} | null>(null);

  const handleOneTimePayment = async (amount: number) => {
    if (!profile?.id) {
      setResult({
        success: false,
        message: "You must be logged in to make a payment"
      });
      return;
    }

    setIsProcessing(true);
    setResult(null);
    
    try {
      // Create a checkout session with Dodo Payments
      const metadata = {
        profile_id: profile.id,
        credits: Math.floor(amount / 100 * 10) // $1 = 10 credits
      };
      
      const session = await PaymentsAPI.createCheckoutSession(
        amount,
        'USD',
        profile.customer_id, // Use existing customer ID if available
        `${window.location.origin}/payment-success`,
        `${window.location.origin}/payment-cancel`,
        metadata
      );
      
      setResult({
        success: true,
        message: "Checkout session created successfully!",
        url: session.url
      });
      
      // Redirect to the checkout page
      if (session.url) {
        window.location.href = session.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      setResult({
        success: false,
        message: `Error creating checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscription = async (planId: string, price: number) => {
    if (!profile?.id) {
      setResult({
        success: false,
        message: "You must be logged in to create a subscription"
      });
      return;
    }

    setIsProcessing(true);
    setResult(null);
    
    try {
      // First, create a customer if one doesn't exist
      let customerId = profile.customer_id;
      
      if (!customerId) {
        const customer = await CustomersAPI.createCustomer(
          profile.email || 'user@example.com',
          profile.username || 'User',
          { profile_id: profile.id }
        );
        customerId = customer.id;
      }
      
      // Create a checkout session for the subscription
      const metadata = {
        profile_id: profile.id,
        plan_id: planId
      };
      
      // Use the PaymentsAPI to create a checkout session for the subscription
      const session = await PaymentsAPI.createCheckoutSession(
        price,
        'USD',
        customerId,
        `${window.location.origin}/subscription-success`,
        `${window.location.origin}/subscription-cancel`,
        metadata
      );
      
      setResult({
        success: true,
        message: "Subscription checkout session created successfully!",
        url: session.url
      });
      
      // Redirect to the checkout page
      if (session.url) {
        window.location.href = session.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setResult({
        success: false,
        message: `Error creating subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto p-8">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-border/30">
          <div className="flex items-center mb-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
            Dodo Payments Test
          </h1>
          <p className="text-foreground/90 mt-2 text-lg">
            Test the Dodo Payments integration with real API calls
          </p>
          {profile ? (
            <p className="text-sm text-muted-foreground mt-2">
              Logged in as: {profile.username || profile.email} (ID: {profile.id})
            </p>
          ) : (
            <Alert className="mt-4 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle>Not logged in</AlertTitle>
              <AlertDescription>You need to be logged in to test payments</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Result Alert */}
        {result && (
          <Alert className={`mb-8 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {result.success ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
            {result.url && (
              <Button 
                className="mt-2" 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = result.url!}
              >
                Go to Checkout
              </Button>
            )}
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="one-time" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="one-time">One-Time Payments</TabsTrigger>
            <TabsTrigger value="subscription">Subscription Plans</TabsTrigger>
          </TabsList>
          
          {/* One-Time Payments */}
          <TabsContent value="one-time" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { amount: 1000, credits: 100, name: "Basic" },
                { amount: 2500, credits: 250, name: "Standard" },
                { amount: 5000, credits: 500, name: "Premium" }
              ].map((plan) => (
                <Card key={plan.name} className="overflow-hidden">
                  <CardHeader className="bg-card/50">
                    <CardTitle>{plan.name} Package</CardTitle>
                    <CardDescription>${plan.amount / 100} USD</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-2xl font-bold">{plan.credits} Credits</p>
                    <p className="text-sm text-muted-foreground mt-2">One-time payment</p>
                  </CardContent>
                  <CardFooter className="flex justify-center border-t bg-card/50 p-4">
                    <Button 
                      onClick={() => handleOneTimePayment(plan.amount)}
                      disabled={isProcessing || !profile}
                      className="w-full"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {isProcessing ? "Processing..." : `Pay $${plan.amount / 100}`}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Subscription Plans */}
          <TabsContent value="subscription" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: "basic", name: "Basic", price: 999, credits: 1000 },
                { id: "pro", name: "Professional", price: 2999, credits: 5000 },
                { id: "unlimited", name: "Unlimited", price: 9999, credits: 50000 }
              ].map((plan) => (
                <Card key={plan.id} className={plan.id === "pro" ? "border-primary shadow-md" : ""}>
                  {plan.id === "pro" && (
                    <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-2xl font-bold">${plan.price / 100}</span>
                      <span className="text-muted-foreground"> / month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-center text-lg font-medium">{plan.credits.toLocaleString()} credits / month</p>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-primary" />
                        <span>Monthly credit refresh</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-primary" />
                        <span>Priority support</span>
                      </li>
                      {plan.id !== "basic" && (
                        <li className="flex items-center">
                          <Check className="mr-2 h-4 w-4 text-primary" />
                          <span>Advanced features</span>
                        </li>
                      )}
                      {plan.id === "unlimited" && (
                        <li className="flex items-center">
                          <Check className="mr-2 h-4 w-4 text-primary" />
                          <span>Enterprise support</span>
                        </li>
                      )}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      variant={plan.id === "pro" ? "default" : "outline"}
                      onClick={() => handleSubscription(plan.id, plan.price)}
                      disabled={isProcessing || !profile}
                    >
                      {isProcessing ? "Processing..." : "Subscribe"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Test Card Information */}
        <div className="mt-12 p-6 bg-card/50 rounded-lg border border-border/40 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Test Information</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">Test Card</h3>
              <p className="text-muted-foreground">Card Number: 4242 4242 4242 4242</p>
              <p className="text-muted-foreground">Expiry: Any future date</p>
              <p className="text-muted-foreground">CVC: Any 3 digits</p>
            </div>
            <div>
              <h3 className="font-medium text-lg">Note</h3>
              <p className="text-muted-foreground">
                This page uses the real Dodo Payments API to create checkout sessions.
                When you click on a payment button, you'll be redirected to the Dodo Payments checkout page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
