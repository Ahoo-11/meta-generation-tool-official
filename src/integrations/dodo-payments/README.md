# Dodo Payments Integration

This directory contains integration files for working with Dodo Payments in the PixelKeywording app using the Model Context Protocol (MCP).

## Setup

1. The integration requires the Dodo Payments MCP Server to be configured in Cursor's MCP settings.
2. The MCP server configuration has been set up in `.cursor/mcp.json`.
3. The API key is already configured in the MCP configuration.

## Files

- `index.ts` - Main export file for the integration
- `types.ts` - Type definitions for Dodo Payments entities
- `mcp-utils.ts` - Utility functions for MCP communication
- `customers.ts` - Customer management functions
- `payments.ts` - Payment processing functions
- `subscriptions.ts` - Subscription management functions

## Usage Example

```typescript
import { createCustomer, createSubscriptionCheckout } from '../integrations/dodo-payments';

// Create a new customer
const customer = await createCustomer('user@example.com', 'John Doe');

// Create a subscription checkout session
const checkoutSession = await createSubscriptionCheckout(
  'price_123456789',
  customer.id,
  window.location.origin + '/success',
  window.location.origin + '/cancel'
);

// Redirect to checkout
window.location.href = checkoutSession.url;
```

## Important Notes

1. The current implementation uses natural language prompts to interact with the Dodo Payments API through the MCP server.
2. The MCP server must be running in Cursor for these functions to work.
3. In production, you might want to enhance this integration to use direct API calls when appropriate.
4. Error handling should be customized based on your application's needs.

## Troubleshooting

- If you get the error "MCP integration not fully implemented", make sure the MCP server is configured correctly in Cursor.
- Check that the API key in `.cursor/mcp.json` is valid.
- Ensure that the `dodopayments-mcp` package is installed (it's already in your dependencies). 