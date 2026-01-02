/**
 * Encode Route
 * 
 * POST /api/encode - Upload and encode an image to JPEG
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { encodeImage, EncodeOptions, checkCliAvailable } from '../services/encoder.js';

export const encodeRouter = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.mkdir(config.uploadDir, { recursive: true });
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxUploadSizeMB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedExts = ['.png', '.ppm', '.pgm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedExts.join(', ')}`));
    }
  },
});

// POST /api/encode
encodeRouter.post('/', upload.single('image'), async (req: Request, res: Response) => {
  // Check CLI availability
  const cliAvailable = await checkCliAvailable();
  if (!cliAvailable) {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'JPEG encoder CLI is not available',
    });
    return;
  }

  // Check file was uploaded
  if (!req.file) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'No image file provided',
    });
    return;
  }

  // Parse options from request body
  const quality = parseInt(req.body.quality || '75', 10);
  const format = req.body.format === 'grayscale' ? 'grayscale' : 'color_420';
  const analyze = req.body.analyze === 'true' || req.body.analyze === true;

  if (quality < 1 || quality > 100) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Quality must be between 1 and 100',
    });
    return;
  }

  const options: EncodeOptions = {
    quality,
    format,
    analyze,
  };

  // Generate output path
  const outputId = uuidv4();
  const outputPath = path.join(config.outputDir, `${outputId}.jpg`);

  try {
    // Ensure output directory exists
    await fs.mkdir(config.outputDir, { recursive: true });

    // Run encoder
    const result = await encodeImage(req.file.path, outputPath, options);

    // Clean up uploaded file (keep output)
    await fs.unlink(req.file.path).catch(() => {});

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    // Clean up on error
    await fs.unlink(req.file.path).catch(() => {});
    
    res.status(500).json({
      error: 'Encoding Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/encode/sample - Encode a sample image
encodeRouter.post('/sample', async (req: Request, res: Response) => {
  const cliAvailable = await checkCliAvailable();
  if (!cliAvailable) {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'JPEG encoder CLI is not available',
    });
    return;
  }

  const { imageName, quality = 75, format = 'color_420', analyze = true } = req.body;

  if (!imageName) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'imageName is required',
    });
    return;
  }

  // Find the sample image
  const inputPath = path.join(config.testImagesDir, imageName);
  
  try {
    await fs.access(inputPath);
  } catch {
    res.status(404).json({
      error: 'Not Found',
      message: `Sample image '${imageName}' not found`,
    });
    return;
  }

  const options: EncodeOptions = {
    quality: parseInt(quality, 10),
    format: format === 'grayscale' ? 'grayscale' : 'color_420',
    analyze: analyze === true || analyze === 'true',
  };

  const outputId = uuidv4();
  const outputPath = path.join(config.outputDir, `${outputId}.jpg`);

  try {
    await fs.mkdir(config.outputDir, { recursive: true });
    const result = await encodeImage(inputPath, outputPath, options);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      error: 'Encoding Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
