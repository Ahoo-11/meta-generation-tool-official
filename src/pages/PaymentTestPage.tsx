import React from 'react';
import { DodoPaymentButton } from '@/components/payments/DodoPaymentButton';
import { DodoSubscriptionButton } from '@/components/payments/DodoSubscriptionButton';
import { PricingPlans } from '@/components/payments/PricingPlans';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PaymentTestPage() {
  return (
    <div className="container mx-auto py-10 space-y-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Dodo Payments Integration Test</h1>
        <p className="text-muted-foreground mt-2">
          Test the Dodo Payments integration with one-time payments and subscriptions
        </p>
      </div>

      <Tabs defaultValue="one-time" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="one-time">One-Time Payments</TabsTrigger>
          <TabsTrigger value="subscription">Subscription Plans</TabsTrigger>
        </TabsList>
        
        <TabsContent value="one-time" className="mt-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Credit Pack 1 */}
            <Card>
              <CardHeader>
                <CardTitle>Small Credit Pack</CardTitle>
                <CardDescription>Perfect for occasional users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$9.99</div>
                <p className="mt-2">100 Credits</p>
              </CardContent>
              <CardFooter>
                <DodoPaymentButton
                  amount={999}
                  productName="Small Credit Pack"
                  buttonText="Buy Credits"
                  className="w-full"
                  metadata={{
                    credits: 100,
                    pack_type: 'small'
                  }}
                />
              </CardFooter>
            </Card>

            {/* Credit Pack 2 */}
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Medium Credit Pack</CardTitle>
                <CardDescription>Our most popular option</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$19.99</div>
                <p className="mt-2">250 Credits</p>
                <p className="text-sm text-green-600 mt-1">25% more value!</p>
              </CardContent>
              <CardFooter>
                <DodoPaymentButton
                  amount={1999}
                  productName="Medium Credit Pack"
                  buttonText="Buy Credits"
                  className="w-full"
                  metadata={{
                    credits: 250,
                    pack_type: 'medium'
                  }}
                />
              </CardFooter>
            </Card>

            {/* Credit Pack 3 */}
            <Card>
              <CardHeader>
                <CardTitle>Large Credit Pack</CardTitle>
                <CardDescription>Best value for power users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$49.99</div>
                <p className="mt-2">750 Credits</p>
                <p className="text-sm text-green-600 mt-1">50% more value!</p>
              </CardContent>
              <CardFooter>
                <DodoPaymentButton
                  amount={4999}
                  productName="Large Credit Pack"
                  buttonText="Buy Credits"
                  className="w-full"
                  metadata={{
                    credits: 750,
                    pack_type: 'large'
                  }}
                />
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="subscription" className="mt-6">
          <PricingPlans />
        </TabsContent>
      </Tabs>

      <div className="bg-muted p-6 rounded-lg mt-10">
        <h2 className="text-xl font-bold mb-4">Testing Information</h2>
        <p className="mb-2">Use the following test cards for Dodo Payments:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Success:</strong> 4242 4242 4242 4242</li>
          <li><strong>Decline:</strong> 4000 0000 0000 0002</li>
          <li><strong>Expiry Date:</strong> Any future date</li>
          <li><strong>CVC:</strong> Any 3 digits</li>
          <li><strong>Name:</strong> Any name</li>
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          This is a test environment. No real payments will be processed.
        </p>
      </div>
    </div>
  );
}

export default PaymentTestPage;
