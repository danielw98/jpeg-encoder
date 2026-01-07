/**
 * Cache Routes
 * 
 * Endpoints for accessing precomputed quality data
 */

import { Router, Request, Response } from 'express';
import { 
  getCachedQualityCurve, 
  getCachedResult, 
  getCacheStats,
  isPrecomputeComplete,
  invalidateCache
} from '../services/precompute.js';

export const cacheRouter = Router();

/**
 * GET /api/cache/status
 * Get precompute cache status
 */
cacheRouter.get('/status', (_req: Request, res: Response) => {
  const stats = getCacheStats();
  res.json({
    ready: isPrecomputeComplete(),
    ...stats,
  });
});

/**
 * POST /api/cache/invalidate
 * Invalidate cache and regenerate
 */
cacheRouter.post('/invalidate', async (_req: Request, res: Response) => {
  res.json({ message: 'Cache invalidation started' });
  // Run in background
  invalidateCache().catch(err => console.error('Cache invalidation failed:', err));
});

/**
 * GET /api/cache/quality-curve/:imageName
 * Get cached quality curve data for a sample image
 */
cacheRouter.get('/quality-curve/:imageName', (req: Request, res: Response) => {
  const { imageName } = req.params;
  
  const cached = getCachedQualityCurve(imageName);
  
  if (!cached) {
    res.json({
      cached: false,
      message: 'Image not in cache, use /api/encode to generate data',
    });
    return;
  }
  
  res.json(cached);
});

/**
 * GET /api/cache/result/:imageName/:quality
 * Get cached result for a specific image and quality level
 */
cacheRouter.get('/result/:imageName/:quality', (req: Request, res: Response) => {
  const { imageName } = req.params;
  const quality = parseInt(req.params.quality, 10);
  
  if (isNaN(quality) || quality < 1 || quality > 100) {
    res.status(400).json({
      error: 'Invalid quality',
      message: 'Quality must be a number between 1 and 100',
    });
    return;
  }
  
  const cached = getCachedResult(imageName, quality);
  
  if (!cached) {
    res.json({
      cached: false,
      message: 'Not in cache',
    });
    return;
  }
  
  res.json({
    cached: true,
    ...cached,
  });
});
