/**
 * Images Route
 * 
 * GET /api/images - List available sample images
 */

import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

export const imagesRouter = Router();

interface ImageInfo {
  name: string;
  path: string;
  size: number;
  extension: string;
}

// GET /api/images - List sample images
imagesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const files = await fs.readdir(config.testImagesDir);
    
    const images: ImageInfo[] = [];
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (['.png', '.ppm', '.pgm', '.jpg', '.jpeg'].includes(ext)) {
        const filePath = path.join(config.testImagesDir, file);
        const stats = await fs.stat(filePath);
        
        images.push({
          name: file,
          path: filePath,
          size: stats.size,
          extension: ext,
        });
      }
    }

    res.json({
      count: images.length,
      images,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list images',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/images/:name - Get image as base64 (for preview)
imagesRouter.get('/:name', async (req: Request, res: Response) => {
  const { name } = req.params;
  const filePath = path.join(config.testImagesDir, name);

  try {
    await fs.access(filePath);
    const data = await fs.readFile(filePath);
    const ext = path.extname(name).toLowerCase();
    
    let mimeType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.ppm' || ext === '.pgm') mimeType = 'application/octet-stream';
    
    const base64 = data.toString('base64');
    
    res.json({
      name,
      mimeType,
      base64,
      size: data.length,
    });
  } catch {
    res.status(404).json({
      error: 'Not Found',
      message: `Image '${name}' not found`,
    });
  }
});
