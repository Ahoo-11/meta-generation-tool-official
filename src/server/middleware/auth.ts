/**
 * Authentication middleware for API routes
 */
import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://alywdwwqrtddplqsbksd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFseXdkd3dxcnRkZHBscXNia3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMjQyNTIsImV4cCI6MjA0OTYwMDI1Mn0.kiuDTgrGVi4rbZ3XYSIfqTTsiNUCvByDo5aDuXkwsZQ';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Middleware to require authentication for API routes
 */
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    
    // Add the user to the request object
    req.user = data.user;
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add user property to Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: Record<string, unknown>;
    }
  }
}

export { requireAuth };
