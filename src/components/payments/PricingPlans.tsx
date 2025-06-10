import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useProfileStore } from '@/stores/profileStore';
import { BillingInterval } from '@/integrations/dodo-payments/types';
import { DodoSubscriptionButton } from './DodoSubscriptionButton';

// Define the pricing plans
const pricingPlans = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'For individuals and small projects',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    features: [
      '1,000 AI generations per month',
      'Basic keyword suggestions',
      'Standard support',
      'Export to CSV'
    ],
    priceId: {
      month: 'price_basic_monthly',
      year: 'price_basic_yearly'
    }
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'For professionals and growing businesses',
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    features: [
      '5,000 AI generations per month',
      'Advanced keyword suggestions',
      'Priority support',
      'Export to CSV and JSON',
      'API access'
    ],
    priceId: {
      month: 'price_pro_monthly',
      year: 'price_pro_yearly'
    },
    highlighted: true
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    description: 'For agencies and large teams',
    monthlyPrice: 49.99,
    yearlyPrice: 499.99,
    features: [
      'Unlimited AI generations',
      'Premium keyword suggestions',
      'Dedicated support',
      'All export formats',
      'Advanced API access',
      'Custom integrations'
    ],
    priceId: {
      month: 'price_unlimited_monthly',
      year: 'price_unlimited_yearly'
    }
  }
];

export function PricingPlans() {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
  const { profile } = useProfileStore();
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
        <p className="text-muted-foreground mt-2">
          Choose the perfect plan for your needs
        </p>
        
        <div className="flex items-center justify-center mt-6">
          <div className="bg-muted p-1 rounded-lg flex">
            <Button
              variant={billingInterval === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingInterval('month')}
            >
              Monthly
            </Button>
            <Button
              variant={billingInterval === 'year' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingInterval('year')}
            >
              Yearly
              <span className="ml-1.5 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                Save 20%
              </span>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {pricingPlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col ${plan.highlighted ? 'border-primary shadow-lg' : ''}`}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">
                  ${billingInterval === 'month' ? plan.monthlyPrice : plan.yearlyPrice}
                </span>
                <span className="text-muted-foreground ml-1">
                  /{billingInterval}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <DodoSubscriptionButton
                planId={plan.id}
                priceId={plan.priceId[billingInterval]}
                amount={billingInterval === 'month' ? plan.monthlyPrice * 100 : plan.yearlyPrice * 100}
                currency="USD"
                billingInterval={billingInterval}
                buttonText="Subscribe"
                buttonVariant={plan.highlighted ? 'default' : 'outline'}
                className="w-full"
                disabled={processingPlanId === plan.id}
                metadata={{
                  plan_name: plan.name,
                  features: plan.features.join(', ')
                }}
              />
            </CardFooter>
          </Card>
        ))}
      </div>


    </div>
  );
}
