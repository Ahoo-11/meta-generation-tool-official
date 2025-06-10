/**
 * Utility for creating API routers with type safety
 */
import { z } from 'zod';
import { Router, Request, Response } from 'express';

/**
 * Creates a router with type-safe procedures
 */
export function createRouter() {
  const router = Router();
  const procedures: Record<string, unknown> = {};

  return {
    /**
     * Define a query procedure (GET request)
     */
    query<TInput = unknown, TOutput = unknown>(
      name: string,
      config: {
        input?: z.ZodType<TInput>;
        resolve: (args: { input: TInput; ctx: { req: Request; res: Response } }) => Promise<TOutput>;
      }
    ) {
      procedures[name] = {
        type: 'query',
        ...config,
      };

      router.get(`/${name}`, async (req, res) => {
        try {
          const input = config.input
            ? config.input.parse(req.query)
            : undefined;

          const result = await config.resolve({
            input,
            ctx: { req, res }
          });

          res.status(200).json(result);
        } catch (error) {
          console.error(`Error in query [${name}]:`, error);
          res.status(500).json({
            error: error.message || 'An unexpected error occurred'
          });
        }
      });

      return this;
    },

    /**
     * Define a mutation procedure (POST request)
     */
    mutation<TInput = unknown, TOutput = unknown>(
      name: string,
      config: {
        input?: z.ZodType<TInput>;
        resolve: (args: { input: TInput; ctx: { req: Request; res: Response } }) => Promise<TOutput>;
      }
    ) {
      procedures[name] = {
        type: 'mutation',
        ...config,
      };

      router.post(`/${name}`, async (req, res) => {
        try {
          const input = config.input
            ? config.input.parse(req.body)
            : undefined;

          const result = await config.resolve({
            input,
            ctx: { req, res }
          });

          res.status(200).json(result);
        } catch (error) {
          console.error(`Error in mutation [${name}]:`, error);
          res.status(500).json({
            error: error.message || 'An unexpected error occurred'
          });
        }
      });

      return this;
    },

    /**
     * Get the Express router with all defined procedures
     */
    getRouter() {
      return router;
    },

    /**
     * Get all defined procedures
     */
    getProcedures() {
      return procedures;
    },
  };
}
