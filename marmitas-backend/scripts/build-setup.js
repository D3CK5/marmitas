/**
 * Build setup script for the backend
 * This script prepares the environment for building the backend application
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../');

// Get the build environment from command line arguments or default to development
const args = process.argv.slice(2);
const env = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || process.env.NODE_ENV || 'development';

console.log(`Preparing build for ${env} environment...`);

// Verify that the environment file exists
const envFile = path.resolve(rootDir, `.env.${env}`);
if (!fs.existsSync(envFile)) {
  console.error(`Error: Environment file .env.${env} not found`);
  process.exit(1);
}

// Copy the environment file to .env for the build process
try {
  fs.copyFileSync(envFile, path.resolve(rootDir, '.env'));
  console.log(`Successfully copied ${envFile} to .env`);
} catch (error) {
  console.error('Error copying environment file:', error);
  process.exit(1);
}

console.log('Build environment setup complete'); 