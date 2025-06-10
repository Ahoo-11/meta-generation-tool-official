/**
 * Utility functions for Dodo Payments MCP integration
 */

// Response interfaces
interface McpResponse<T> {
  result: T;
  error?: string;
}

// Payment interfaces
interface PaymentParams {
  amount: number;
  currency: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  receiptEmail?: string;
  statementDescriptor?: string;
  [key: string]: unknown;
}

interface ListPaymentsParams {
  limit?: number;
  startingAfter?: string;
  endingBefore?: string;
  customerId?: string;
  [key: string]: unknown;
}

// Customer interfaces
interface CustomerParams {
  email?: string;
  name?: string;
  phone?: string;
  address?: AddressParam;
  metadata?: Record<string, unknown>;
  description?: string;
  [key: string]: unknown;
}

interface AddressParam {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface ListCustomersParams {
  limit?: number;
  startingAfter?: string;
  endingBefore?: string;
  email?: string;
  [key: string]: unknown;
}

// Subscription interfaces
interface SubscriptionParams {
  customerId: string;
  priceId: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
  cancelAtPeriodEnd?: boolean;
  trialPeriodDays?: number;
  [key: string]: unknown;
}

interface UpdateSubscriptionParams {
  priceId?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
  cancelAtPeriodEnd?: boolean;
  [key: string]: unknown;
}

/**
 * Makes a call to the Dodo Payments MCP server
 * This function handles communication with the MCP server configured in mcp_config.json
 */
export const callMcp = async <T>(prompt: Record<string, unknown> | string, toolName: string): Promise<T> => {
  console.log('MCP call:', prompt);
  
  try {
    // Create a request to the MCP server
    const response = await fetch('/api/mcp/dodopayments_api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        function: `mcp1_${toolName}`,
        args: typeof prompt === 'string' ? JSON.parse(prompt) : prompt
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json() as McpResponse<T>;
    
    if (data.error) {
      throw new Error(`MCP error: ${data.error}`);
    }
    
    return data.result;
  } catch (error) {
    console.error('Error in MCP call:', error);
    throw error;
  }
};

/**
 * Direct tool calls to the Dodo Payments MCP
 * These functions provide a more structured way to interact with specific MCP tools
 */

// Payment Operations
export const createPayment = async (params: PaymentParams) => {
  return callMcp(JSON.stringify(params), 'create_payments');
};

export const retrievePayment = async (paymentId: string) => {
  return callMcp(JSON.stringify({ id: paymentId }), 'retrieve_payments');
};

export const listPayments = async (params: ListPaymentsParams) => {
  return callMcp(JSON.stringify(params), 'list_payments');
};

// Customer Management
export const createCustomer = async (params: CustomerParams) => {
  return callMcp(JSON.stringify(params), 'create_customers');
};

export const retrieveCustomer = async (customerId: string) => {
  return callMcp(JSON.stringify({ id: customerId }), 'retrieve_customers');
};

export const updateCustomer = async (customerId: string, params: CustomerParams) => {
  return callMcp(JSON.stringify({ id: customerId, ...params }), 'update_customers');
};

export const listCustomers = async (params: ListCustomersParams) => {
  return callMcp(JSON.stringify(params), 'list_customers');
};

// Subscription Management
export const createSubscription = async (params: SubscriptionParams) => {
  return callMcp(JSON.stringify(params), 'create_subscriptions');
};

export const retrieveSubscription = async (subscriptionId: string) => {
  return callMcp(JSON.stringify({ id: subscriptionId }), 'retrieve_subscriptions');
};

export const updateSubscription = async (subscriptionId: string, params: UpdateSubscriptionParams) => {
  return callMcp(JSON.stringify({ id: subscriptionId, ...params }), 'update_subscriptions');
};

export const listSubscriptions = async (params: ListPaymentsParams) => {
  return callMcp(JSON.stringify(params), 'list_subscriptions');
};

// Cancel a subscription
export const cancelSubscription = async (subscriptionId: string) => {
  return callMcp(JSON.stringify({ id: subscriptionId, cancelAtPeriodEnd: true }), 'cancel_subscription');
};

// Checkout session
export const createCheckoutSession = async (params: {
  amount: number;
  currency: string;
  customerId?: string | null;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown>;
}) => {
  // Format the request for Dodo Payments create_payments API
  const paymentRequest = {
    billing_currency: params.currency,
    allowed_payment_method_types: ['credit', 'debit'],
    product_cart: [
      {
        amount: Math.round(params.amount * 100), // Convert to cents
        product_id: 'custom', // Use a placeholder product ID
        quantity: 1
      }
    ],
    return_url: params.successUrl,
    payment_link: true,
    metadata: params.metadata || {}
  };
  
  if (params.customerId) {
    paymentRequest['customer'] = {
      customer_id: params.customerId
    };
  }
  
  return callMcp(paymentRequest, 'create_payments');
};