import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
// Load environment variables based on NODE_ENV
const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(rootDir, `.env.${env}`);
// Fallback to .env if specific environment file doesn't exist
dotenv.config({ path: envPath });
dotenv.config({ path: path.resolve(rootDir, '.env') });
const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_SERVICE_KEY || '',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};
export default config;
//# sourceMappingURL=env.js.map