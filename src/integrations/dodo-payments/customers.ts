/**
 * Customer-related operations with Dodo Payments
 */
import { Customer } from './types';
import { callMcp } from './mcp-utils';

/**
 * Creates a new customer in Dodo Payments
 */
export async function createCustomer(
  email: string, 
  name?: string, 
  metadata?: Record<string, unknown>
): Promise<Customer> {
  try {
    // Construct the request to create a customer
    const request = {
      email,
      name,
      metadata
    };
    
    const prompt = `Create a new customer in Dodo Payments with: ${JSON.stringify(request)}`;
    return await callMcp<Customer>(prompt);
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

/**
 * Retrieves a customer by ID
 */
export async function getCustomer(customerId: string): Promise<Customer> {
  try {
    const prompt = `Retrieve customer with ID: ${customerId} from Dodo Payments`;
    return await callMcp<Customer>(prompt);
  } catch (error) {
    console.error('Error retrieving customer:', error);
    throw error;
  }
}

/**
 * Updates a customer's information
 */
export async function updateCustomer(
  customerId: string,
  updates: Partial<Omit<Customer, 'id' | 'createdAt'>>
): Promise<Customer> {
  try {
    const prompt = `Update customer with ID: ${customerId} in Dodo Payments with: ${JSON.stringify(updates)}`;
    return await callMcp<Customer>(prompt);
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
}

/**
 * Creates a customer portal session for managing billing
 */
export async function createCustomerPortalSession(
  customerId: string, 
  returnUrl: string
): Promise<string> {
  try {
    const prompt = `Create a customer portal session for customer ID: ${customerId} with return URL: ${returnUrl} in Dodo Payments`;
    const session = await callMcp<{ url: string }>(prompt);
    return session.url;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
} 