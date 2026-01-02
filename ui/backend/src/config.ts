/**
 * Application Configuration
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..', '..');

export interface AppConfig {
  port: number;
  cliPath: string;
  uploadDir: string;
  outputDir: string;
  testImagesDir: string;
  maxUploadSizeMB: number;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  cliPath: process.env.CLI_PATH || path.join(projectRoot, 'build', 'Debug', 'jpegdsp_cli_encode.exe'),
  uploadDir: path.join(__dirname, '..', 'uploads'),
  outputDir: path.join(__dirname, '..', 'outputs'),
  testImagesDir: process.env.IMAGES_DIR || path.join(projectRoot, 'data', 'standard_test_images'),
  maxUploadSizeMB: 50,
};
