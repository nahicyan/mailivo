// api/src/middleware/serviceAuth.middleware.ts
// NEW FILE - Service-to-service authentication middleware
import { Request, Response, NextFunction } from 'express';

export interface ServiceAuthRequest extends Request {
  service?: string;
}

export const authenticateService = (
  req: ServiceAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedApiKey = process.env.LANDIVO_API_KEY;

  if (!expectedApiKey) {
    console.error('LANDIVO_API_KEY not configured in environment');
    res.status(500).json({ error: 'Service authentication not configured' });
    return;
  }

  if (!apiKey) {
    res.status(401).json({ error: 'Missing API key' });
    return;
  }

  if (apiKey !== expectedApiKey) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  req.service = 'landivo';
  next();
};