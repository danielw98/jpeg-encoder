/**
 * Precompute Cache Service
 * 
 * Pre-encodes sample images at multiple quality levels for instant loading.
 * Results are persisted to disk and loaded on startup.
 */

import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { config } from '../config.js';
import { encodeImage, EncodeResult } from './encoder.js';

// Quality levels to precompute
const QUALITY_LEVELS = [10, 25, 50, 65, 75, 85, 90, 95, 100];

// Cache file path
const CACHE_FILE = path.join(config.outputDir, 'precompute_cache.json');

// Cache structure: imageName -> quality -> result
interface CacheEntry {
  quality: number;
  compressedBytes: number;
  compressionRatio: number;
  outputUrl: string;
  outputFile: string;
}

interface ImageCache {
  imageName: string;
  originalBytes: number;
  originalWidth: number;
  originalHeight: number;
  levels: Map<number, CacheEntry>;
  ready: boolean;
}

// Serializable version for disk storage
interface SerializedCache {
  version: number;
  timestamp: string;
  images: Array<{
    imageName: string;
    originalBytes: number;
    originalWidth: number;
    originalHeight: number;
    levels: Array<CacheEntry>;
  }>;
}

// In-memory cache
const cache = new Map<string, ImageCache>();

// Precompute status
let precomputeComplete = false;
let precomputeInProgress = false;

/**
 * Load cache from disk if available
 */
async function loadCacheFromDisk(): Promise<boolean> {
  try {
    if (!existsSync(CACHE_FILE)) {
      console.log('[Precompute] No cache file found');
      return false;
    }
    
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    const serialized: SerializedCache = JSON.parse(data);
    
    // Version check for future compatibility
    if (serialized.version !== 1) {
      console.log('[Precompute] Cache version mismatch, will regenerate');
      return false;
    }
    
    // Verify all output files still exist
    for (const img of serialized.images) {
      for (const level of img.levels) {
        if (!existsSync(level.outputFile)) {
          console.log(`[Precompute] Missing file ${level.outputFile}, will regenerate`);
          return false;
        }
      }
    }
    
    // Restore to memory cache
    for (const img of serialized.images) {
      const imageCache: ImageCache = {
        imageName: img.imageName,
        originalBytes: img.originalBytes,
        originalWidth: img.originalWidth,
        originalHeight: img.originalHeight,
        levels: new Map(img.levels.map(l => [l.quality, l])),
        ready: true,
      };
      cache.set(img.imageName, imageCache);
    }
    
    console.log(`[Precompute] Loaded ${serialized.images.length} images from cache (${serialized.timestamp})`);
    return true;
  } catch (err) {
    console.error('[Precompute] Failed to load cache:', err);
    return false;
  }
}

/**
 * Save cache to disk
 */
async function saveCacheToDisk(): Promise<void> {
  try {
    const serialized: SerializedCache = {
      version: 1,
      timestamp: new Date().toISOString(),
      images: Array.from(cache.values())
        .filter(img => img.ready)
        .map(img => ({
          imageName: img.imageName,
          originalBytes: img.originalBytes,
          originalWidth: img.originalWidth,
          originalHeight: img.originalHeight,
          levels: Array.from(img.levels.values()),
        })),
    };
    
    await fs.writeFile(CACHE_FILE, JSON.stringify(serialized, null, 2));
    console.log(`[Precompute] Saved cache to disk (${serialized.images.length} images)`);
  } catch (err) {
    console.error('[Precompute] Failed to save cache:', err);
  }
}

/**
 * Get list of sample images from the test images directory
 */
async function getSampleImages(): Promise<string[]> {
  try {
    const files = await fs.readdir(config.testImagesDir);
    return files.filter(f => 
      f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.ppm')
    );
  } catch {
    return [];
  }
}

/**
 * Precompute all quality levels for a single image
 */
async function precomputeImage(imageName: string): Promise<void> {
  const inputPath = path.join(config.testImagesDir, imageName);
  const baseName = path.basename(imageName, path.extname(imageName));
  
  const imageCache: ImageCache = {
    imageName,
    originalBytes: 0,
    originalWidth: 0,
    originalHeight: 0,
    levels: new Map(),
    ready: false,
  };
  
  cache.set(imageName, imageCache);
  
  for (const quality of QUALITY_LEVELS) {
    const outputFilename = `precompute_${baseName}_q${quality}.jpg`;
    const outputPath = path.join(config.outputDir, outputFilename);
    
    try {
      const result = await encodeImage(inputPath, outputPath, {
        quality,
        format: 'color_420',
        analyze: false,
      });
      
      if (result.success) {
        // Store first result's metadata
        if (imageCache.originalBytes === 0) {
          imageCache.originalBytes = result.originalBytes;
          imageCache.originalWidth = result.originalWidth;
          imageCache.originalHeight = result.originalHeight;
        }
        
        imageCache.levels.set(quality, {
          quality,
          compressedBytes: result.compressedBytes,
          compressionRatio: result.compressionRatio,
          outputUrl: result.outputUrl,
          outputFile: result.outputFile,
        });
      }
    } catch (err) {
      console.error(`Failed to precompute ${imageName} at Q${quality}:`, err);
    }
  }
  
  imageCache.ready = true;
}

/**
 * Start precomputing all sample images in the background
 * First tries to load from disk cache, only regenerates if needed
 */
export async function startPrecompute(): Promise<void> {
  if (precomputeInProgress) {
    console.log('[Precompute] Already in progress, skipping...');
    return;
  }
  
  precomputeInProgress = true;
  
  // Try to load from disk first
  const loaded = await loadCacheFromDisk();
  if (loaded) {
    precomputeComplete = true;
    precomputeInProgress = false;
    console.log('[Precompute] Using cached data from disk');
    return;
  }
  
  console.log('[Precompute] Starting precomputation of sample images...');
  
  const images = await getSampleImages();
  console.log(`[Precompute] Found ${images.length} sample images`);
  
  let completed = 0;
  for (const imageName of images) {
    await precomputeImage(imageName);
    completed++;
    console.log(`[Precompute] ${completed}/${images.length} - ${imageName}`);
  }
  
  // Save to disk for next restart
  await saveCacheToDisk();
  
  precomputeComplete = true;
  precomputeInProgress = false;
  console.log('[Precompute] Complete! All sample images cached.');
}

/**
 * Check if precompute is complete
 */
export function isPrecomputeComplete(): boolean {
  return precomputeComplete;
}

/**
 * Get cached quality curve data for a sample image
 */
export function getCachedQualityCurve(imageName: string): {
  cached: boolean;
  data: Array<{ quality: number; compressedBytes: number; ratio: number; sizeKB: number; outputUrl: string }>;
  originalBytes: number;
} | null {
  const imageCache = cache.get(imageName);
  
  if (!imageCache || !imageCache.ready) {
    return null;
  }
  
  const data = Array.from(imageCache.levels.values())
    .map(entry => ({
      quality: entry.quality,
      compressedBytes: entry.compressedBytes,
      ratio: entry.compressionRatio,
      sizeKB: entry.compressedBytes / 1024,
      outputUrl: entry.outputUrl,
    }))
    .sort((a, b) => a.quality - b.quality);
  
  return {
    cached: true,
    data,
    originalBytes: imageCache.originalBytes,
  };
}

/**
 * Get cached result for a specific image and quality level
 */
export function getCachedResult(imageName: string, quality: number): CacheEntry | null {
  const imageCache = cache.get(imageName);
  
  if (!imageCache || !imageCache.ready) {
    return null;
  }
  
  // Find exact match or closest quality
  if (imageCache.levels.has(quality)) {
    return imageCache.levels.get(quality)!;
  }
  
  // Find closest cached quality
  const qualities = Array.from(imageCache.levels.keys()).sort((a, b) => a - b);
  let closest = qualities[0];
  let minDiff = Math.abs(quality - closest);
  
  for (const q of qualities) {
    const diff = Math.abs(quality - q);
    if (diff < minDiff) {
      minDiff = diff;
      closest = q;
    }
  }
  
  return imageCache.levels.get(closest) || null;
}

/**
 * Get all cached image names
 */
export function getCachedImageNames(): string[] {
  return Array.from(cache.keys()).filter(name => cache.get(name)?.ready);
}

/**
 * Get cache stats
 */
export function getCacheStats(): {
  totalImages: number;
  readyImages: number;
  totalEntries: number;
  precomputeComplete: boolean;
  qualityLevels: number[];
} {
  let totalEntries = 0;
  let readyImages = 0;
  
  for (const imageCache of cache.values()) {
    if (imageCache.ready) {
      readyImages++;
      totalEntries += imageCache.levels.size;
    }
  }
  
  return {
    totalImages: cache.size,
    readyImages,
    totalEntries,
    precomputeComplete,
    qualityLevels: QUALITY_LEVELS,
  };
}

/**
 * Invalidate cache and regenerate
 */
export async function invalidateCache(): Promise<void> {
  console.log('[Precompute] Invalidating cache...');
  
  // Clear memory cache
  cache.clear();
  precomputeComplete = false;
  
  // Delete cache file
  try {
    if (existsSync(CACHE_FILE)) {
      await fs.unlink(CACHE_FILE);
      console.log('[Precompute] Deleted cache file');
    }
  } catch (err) {
    console.error('[Precompute] Failed to delete cache file:', err);
  }
  
  // Start fresh precompute
  await startPrecompute();
}
