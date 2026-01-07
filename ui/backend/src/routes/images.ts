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

// Friendly names for test images (from Kodak PhotoCD credits)
const FRIENDLY_NAMES: Record<string, string> = {
  // Classic test images
  'baboon': 'Baboon (Mandrill)',
  'peppers': 'Peppers',
  'lake': 'Lake',
  'house': 'House',
  // Kodak PhotoCD dataset - official descriptions
  'kodim01': '01 - Stone Building',
  'kodim02': '02 - Red Door',
  'kodim03': '03 - Hats',
  'kodim04': '04 - Portrait Girl in Red',
  'kodim05': '05 - Motocross Bikes',
  'kodim06': '06 - Sailboat at Anchor',
  'kodim07': '07 - Shuttered Windows',
  'kodim08': '08 - Market Place',
  'kodim09': '09 - Sailboats Spinnakers',
  'kodim10': '10 - Offshore Sailboat Race',
  'kodim11': '11 - Sailboat at Pier',
  'kodim12': '12 - Couple on Beach',
  'kodim13': '13 - Mountain Stream',
  'kodim14': '14 - White Water Rafters',
  'kodim15': '15 - Girl Painted Face',
  'kodim16': '16 - Tropical Key',
  'kodim17': '17 - Monument Cologne',
  'kodim18': '18 - Model Black Dress',
  'kodim19': '19 - Lighthouse Maine',
  'kodim20': '20 - P51 Mustang',
  'kodim21': '21 - Portland Head Light',
  'kodim22': '22 - Barn and Pond',
  'kodim23': '23 - Two Macaws',
  'kodim24': '24 - Mountain Chalet',
};

/**
 * Get friendly display name for an image
 */
function getDisplayName(filename: string): string {
  const stem = path.basename(filename, path.extname(filename));
  return FRIENDLY_NAMES[stem] || stem.replace(/_/g, ' ');
}

interface ImageInfo {
  name: string;
  displayName: string;
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
          displayName: getDisplayName(file),
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

// GET /api/images/:name/raw - Serve raw image file
imagesRouter.get('/:name/raw', async (req: Request, res: Response) => {
  const { name } = req.params;
  const filePath = path.join(config.testImagesDir, name);

  try {
    await fs.access(filePath);
    const data = await fs.readFile(filePath);
    const ext = path.extname(name).toLowerCase();
    
    let mimeType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.ppm' || ext === '.pgm') mimeType = 'image/png';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', data.length);
    res.send(data);
  } catch {
    res.status(404).json({
      error: 'Not Found',
      message: `Image '${name}' not found`,
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
