import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentsAPI, SubscriptionsAPI, CustomersAPI } from '@/integrations/dodo-payments/api';
import { useProfileStore } from '@/stores/profileStore';
import { DodoPayments } from 'dodopayments-checkout';

// Consolidated Dodo Payments Test Page
export default function DodoPaymentTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [amount, setAmount] = useState('10.00');
  const [currency, setCurrency] = useState('USD');
  const [customerId, setCustomerId] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [planId, setPlanId] = useState('');
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const { profile } = useProfileStore();

  // Initialize Dodo Payments SDK
  React.useEffect(() => {
    try {
      DodoPayments.Initialize({
        apiKey: import.meta.env.VITE_DODO_PAYMENTS_API_KEY || 'Y5h-0edhftQ-_aWv.UDaLs-NfZ0DRsjzWCVZztJH_9xCF9UL7dHbe34fZZyDQd6Ij',
        mode: import.meta.env.VITE_DODO_PAYMENTS_MODE || 'test'
      });
    } catch (error) {
      console.error('Failed to initialize Dodo Payments SDK:', error);
    }
  }, []);

  // Test API-based payment (server-side)
  const handleAPIPayment = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      const successUrl = `${window.location.origin}/payment-success`;
      const cancelUrl = `${window.location.origin}/payment-cancel`;
      
      const session = await PaymentsAPI.createCheckoutSession(
        parseFloat(amount),
        currency,
        customerId || undefined,
        successUrl,
        cancelUrl,
        {
          test: true,
          user_id: profile?.id || 'anonymous',
          payment_type: 'one_time'
        }
      );
      
      setResult(`✅ API Checkout session created!\n\nSession ID: ${session.id}\nCheckout URL: ${session.url}\n\nRedirecting to checkout...`);
      
      if (session.url) {
        setTimeout(() => {
          window.location.href = session.url;
        }, 2000);
      }
    } catch (error) {
      console.error('API Payment error:', error);
      setResult(`❌ API Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test SDK-based payment (client-side)
  const handleSDKPayment = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      const checkoutOptions = {
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        currency: currency,
        productId: 'test-product',
        customerId: customerId || undefined,
        metadata: {
          test: true,
          user_id: profile?.id || 'anonymous',
          payment_type: 'sdk_direct'
        },
        onSuccess: (data: any) => {
          setResult(`✅ SDK Payment successful!\n\nPayment ID: ${data.paymentId}\nStatus: ${data.status}`);
          setIsLoading(false);
        },
        onError: (error: any) => {
          setResult(`❌ SDK Payment failed: ${error.message}`);
          setIsLoading(false);
        },
        onCancel: () => {
          setResult('⚠️ SDK Payment cancelled by user');
          setIsLoading(false);
        }
      };
      
      DodoPayments.Checkout.open(checkoutOptions);
      setResult('🔄 SDK Checkout opened...');
    } catch (error) {
      console.error('SDK Payment error:', error);
      setResult(`❌ SDK Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setIsLoading(false);
    }
  };

  // Test subscription payment
  const handleSubscriptionPayment = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      const session = await PaymentsAPI.createCheckoutSession(
        interval === 'monthly' ? 29.99 : 299.99,
        currency,
        customerId || undefined,
        `${window.location.origin}/subscription-success`,
        `${window.location.origin}/subscription-cancel`,
        {
          test: true,
          user_id: profile?.id || 'anonymous',
          payment_type: 'subscription',
          billing_interval: interval,
          plan_id: planId || `test_${interval}_plan`
        }
      );
      
      setResult(`✅ Subscription checkout created!\n\nSession ID: ${session.id}\nBilling: ${interval}\nAmount: ${interval === 'monthly' ? '$29.99' : '$299.99'}\n\nRedirecting...`);
      
      if (session.url) {
        setTimeout(() => {
          window.location.href = session.url;
        }, 2000);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setResult(`❌ Subscription Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test customer creation
  const handleCreateCustomer = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      const customer = await CustomersAPI.createCustomer({
        email,
        name,
        metadata: {
          test: true,
          created_from: 'consolidated_test_page'
        }
      });
      
      setResult(`✅ Customer created!\n\nCustomer ID: ${customer.id}\nEmail: ${customer.email}\nName: ${customer.name}`);
      setCustomerId(customer.id);
    } catch (error) {
      console.error('Customer creation error:', error);
      setResult(`❌ Customer Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          🦤 Dodo Payments Test Center
        </h1>
        <p className="text-muted-foreground">
          Comprehensive testing for Dodo Payments integration - API, SDK, and Subscriptions
        </p>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary">Test Mode</Badge>
          <Badge variant="outline">API + SDK</Badge>
          <Badge variant="outline">Authenticated</Badge>
        </div>
      </div>

      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="info">Test Info</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* API Payment */}
            <Card>
              <CardHeader>
                <CardTitle>🔗 API Payment (Server-side)</CardTitle>
                <CardDescription>
                  Test payment via server API endpoint
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="api-amount">Amount</Label>
                  <Input
                    id="api-amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="10.00"
                  />
                </div>
                <div>
                  <Label htmlFor="api-currency">Currency</Label>
                  <Input
                    id="api-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="USD"
                  />
                </div>
                <Button 
                  onClick={handleAPIPayment}
                  disabled={isLoading || !amount}
                  className="w-full"
                >
                  {isLoading ? 'Processing...' : `Pay ${currency} ${amount} (API)`}
                </Button>
              </CardContent>
            </Card>

            {/* SDK Payment */}
            <Card>
              <CardHeader>
                <CardTitle>⚡ SDK Payment (Client-side)</CardTitle>
                <CardDescription>
                  Test payment via Dodo SDK overlay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Amount: {currency} {amount}</Label>
                  <p className="text-sm text-muted-foreground">
                    Uses same amount from API payment
                  </p>
                </div>
                <Button 
                  onClick={handleSDKPayment}
                  disabled={isLoading || !amount}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading ? 'Opening...' : `Pay ${currency} ${amount} (SDK)`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🔄 Subscription Payments</CardTitle>
              <CardDescription>
                Test recurring subscription payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="interval">Billing Interval</Label>
                  <select
                    id="interval"
                    value={interval}
                    onChange={(e) => setInterval(e.target.value as 'monthly' | 'yearly')}
                    className="w-full p-2 border rounded"
                  >
                    <option value="monthly">Monthly ($29.99)</option>
                    <option value="yearly">Yearly ($299.99)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="planId">Plan ID (Optional)</Label>
                  <Input
                    id="planId"
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>
              <Button 
                onClick={handleSubscriptionPayment}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Processing...' : `Subscribe ${interval === 'monthly' ? 'Monthly' : 'Yearly'}`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>👤 Customer Management</CardTitle>
              <CardDescription>
                Create and manage test customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Test User"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customerId">Customer ID</Label>
                <Input
                  id="customerId"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="Will be auto-filled after creation"
                  readOnly={!customerId}
                />
              </div>
              <Button 
                onClick={handleCreateCustomer}
                disabled={isLoading || !email || !name}
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Create Customer'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Test Cards */}
            <Card>
              <CardHeader>
                <CardTitle>💳 Test Cards</CardTitle>
                <CardDescription>
                  Use these test card numbers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm font-mono">
                  <div><strong>Success:</strong> 4242 4242 4242 4242</div>
                  <div><strong>Decline:</strong> 4000 0000 0000 0002</div>
                  <div><strong>3D Secure:</strong> 4000 0000 0000 3220</div>
                  <div><strong>Insufficient:</strong> 4000 0000 0000 9995</div>
                  <div className="text-muted-foreground mt-2 font-sans">
                    Use any future expiry date and any 3-digit CVC
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Flow */}
            <Card>
              <CardHeader>
                <CardTitle>🧪 Test Flow</CardTitle>
                <CardDescription>
                  Recommended testing sequence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Create a test customer</li>
                  <li>Test API payment (server-side)</li>
                  <li>Test SDK payment (client-side)</li>
                  <li>Test subscription payment</li>
                  <li>Use different test cards</li>
                  <li>Check webhook events</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Test Results</CardTitle>
          <CardDescription>
            API responses and status updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={result}
            readOnly
            placeholder="Test results will appear here...\n\n• API responses\n• Payment status\n• Error messages\n• Success confirmations"
            className="min-h-[200px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">🔧 Configuration Status:</h3>
        <div className="grid gap-2 text-sm">
          <div>API Key: {import.meta.env.VITE_DODO_PAYMENTS_API_KEY ? '✅ Configured' : '❌ Missing'}</div>
          <div>API URL: {import.meta.env.VITE_DODO_PAYMENTS_API_URL ? '✅ Configured' : '❌ Missing'}</div>
          <div>Mode: {import.meta.env.VITE_DODO_PAYMENTS_MODE || 'test'}</div>
          <div>User: {profile?.email || 'Not logged in'}</div>
        </div>
      </div>
    </div>
  );
}
