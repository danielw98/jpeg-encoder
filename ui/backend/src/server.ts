/**
 * JPEGDSP Backend Server
 * 
 * Node.js + Express backend that calls the C++ CLI encoder
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';
import { encodeRouter } from './routes/encode.js';
import { imagesRouter } from './routes/images.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// -----------------------------------------------------------------------------
// Express App
// -----------------------------------------------------------------------------

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());

// Serve static output files
app.use('/outputs', express.static(config.outputDir));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/encode', encodeRouter);
app.use('/api/images', imagesRouter);

// Root endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'JPEGDSP Backend API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      encode: 'POST /api/encode',
      images: 'GET /api/images',
    },
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Serve frontend static files in production
const publicDir = process.env.PUBLIC_DIR || path.join(__dirname, '..', 'public');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(publicDir));
  
  // SPA fallback - serve index.html for non-API routes
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// -----------------------------------------------------------------------------
// Start Server
// -----------------------------------------------------------------------------

app.listen(config.port, () => {
  console.log('\n' + '='.repeat(60));
  console.log('  JPEGDSP Backend Server');
  console.log('='.repeat(60));
  console.log(`  Port:        ${config.port}`);
  console.log(`  CLI Path:    ${config.cliPath}`);
  console.log(`  Uploads:     ${config.uploadDir}`);
  console.log(`  Outputs:     ${config.outputDir}`);
  console.log('='.repeat(60));
  console.log(`\n  API available at http://localhost:${config.port}/api\n`);
});

export default app;
