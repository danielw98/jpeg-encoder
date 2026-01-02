/**
 * Health Check Route
 */

import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import { config } from '../config.js';
import { checkCliAvailable } from '../services/encoder.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const cliAvailable = await checkCliAvailable();
  
  // Check if test images directory exists
  let testImagesAvailable = false;
  try {
    await fs.access(config.testImagesDir);
    testImagesAvailable = true;
  } catch {
    testImagesAvailable = false;
  }

  const status = cliAvailable ? 'healthy' : 'degraded';

  res.json({
    status,
    timestamp: new Date().toISOString(),
    components: {
      cli: {
        available: cliAvailable,
        path: config.cliPath,
      },
      testImages: {
        available: testImagesAvailable,
        path: config.testImagesDir,
      },
    },
    config: {
      port: config.port,
      maxUploadSizeMB: config.maxUploadSizeMB,
    },
  });
});
