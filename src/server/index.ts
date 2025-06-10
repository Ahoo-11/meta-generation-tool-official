/**
 * Express server for handling API requests
 */
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import API routes
import paymentsRoutes from './api/payments.js';
import customersRoutes from './api/customers.js';
import subscriptionsRoutes from './api/subscriptions.js';
import dodoPaymentsRouter from './api/dodoPaymentsRouter.js';
import mcpRoutes from './api/mcp.js';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API routes
app.use('/api/payments', paymentsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/dodo-payments', dodoPaymentsRouter);
app.use('/api/mcp', mcpRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
