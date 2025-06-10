/**
 * Test file for Dodo Payments integration
 * This file is for testing purposes only and should not be imported in production code
 */

import { createCustomer, getCustomer } from './customers';
import { createCheckoutSession, getPayment } from './payments';
import { createSubscriptionCheckout, getSubscription } from './subscriptions';

/**
 * Test function to verify the Dodo Payments integration
 * Run this function directly in Cursor where the MCP server is configured
 */
export async function testDodoPaymentsIntegration() {
  try {
    console.log('Testing Dodo Payments integration...');
    
    // Test customer creation
    console.log('Testing customer creation...');
    try {
      const customer = await createCustomer('test@example.com', 'Test User');
      console.log('Customer created:', customer);
      
      // Test customer retrieval
      console.log('Testing customer retrieval...');
      const retrievedCustomer = await getCustomer(customer.id);
      console.log('Customer retrieved:', retrievedCustomer);
    } catch (error) {
      console.error('Customer test failed:', error);
    }
    
    // Test payment checkout session
    console.log('Testing payment checkout session...');
    try {
      const checkoutSession = await createCheckoutSession(
        1000, // $10.00
        'usd',
        undefined, // No customer ID
        'http://localhost:3000/success',
        'http://localhost:3000/cancel'
      );
      console.log('Checkout session created:', checkoutSession);
    } catch (error) {
      console.error('Payment checkout test failed:', error);
    }
    
    // Test subscription checkout session
    console.log('Testing subscription checkout session...');
    try {
      const subscriptionCheckout = await createSubscriptionCheckout(
        'price_123456789', // This would be a real price ID in production
        undefined, // No customer ID
        'http://localhost:3000/success',
        'http://localhost:3000/cancel'
      );
      console.log('Subscription checkout session created:', subscriptionCheckout);
    } catch (error) {
      console.error('Subscription checkout test failed:', error);
    }
    
    console.log('Dodo Payments integration test completed');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Uncomment to run the test
// testDodoPaymentsIntegration(); 