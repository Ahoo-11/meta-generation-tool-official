import { handleDodoPaymentsWebhook } from '@/integrations/dodo-payments/webhooks/dodo-payments';

/**
 * Route handler for Dodo Payments webhooks
 * This simply forwards the request to the webhook handler in the integrations directory
 */
export async function POST(request: Request) {
  return handleDodoPaymentsWebhook(request);
}
