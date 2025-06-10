/**
 * Main API Router
 * Registers all API routes
 */

import { Router } from 'express';
import paymentsRouter from './payments';
import webhooksRouter from './webhooks/dodo-payments';

const router = Router();

// Register API routes
router.use('/payments', paymentsRouter);
router.use('/webhooks', webhooksRouter);

export default router;
