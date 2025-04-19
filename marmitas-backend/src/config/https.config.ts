import fs from 'fs';
import path from 'path';
import https from 'https';
import { config } from './app.config.js';

/**
 * HTTPS Configuration for the application server
 * This configures TLS 1.3 with strong cipher suites for secure communications
 */
export const httpsConfig = {
  /**
   * Creates HTTPS server options with TLS 1.3 and secure cipher suites
   * @returns HTTPS server options or null if HTTPS not enabled
   */
  getOptions(): https.ServerOptions | null {
    // If HTTPS is not enabled, return null
    if (!config.app.httpsEnabled) {
      return null;
    }

    try {
      // Get the certificate and key paths
      const keyPath = process.env.HTTPS_KEY_PATH || path.resolve(process.cwd(), '../infrastructure/certs/key.pem');
      const certPath = process.env.HTTPS_CERT_PATH || path.resolve(process.cwd(), '../infrastructure/certs/cert.pem');
      
      // Check if files exist
      if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        console.warn(`HTTPS certificate files not found at ${keyPath} or ${certPath}`);
        console.warn('Generate development certificates using: npm run generate-certs');
        return null;
      }
      
      // Read certificate files
      const key = fs.readFileSync(keyPath, 'utf8');
      const cert = fs.readFileSync(certPath, 'utf8');
      
      // Return HTTPS options with TLS 1.3 and secure ciphers
      return {
        key,
        cert,
        minVersion: 'TLSv1.3', // Only allow TLS 1.3
        ciphers: [
          'TLS_AES_256_GCM_SHA384',
          'TLS_AES_128_GCM_SHA256',
          'TLS_CHACHA20_POLY1305_SHA256'
        ].join(':'),
        honorCipherOrder: true, // Prioritize server cipher preferences
        requestCert: false, // Don't require client certificates
        rejectUnauthorized: false // Don't reject unauthorized clients in development
      };
    } catch (error) {
      console.error('Error loading HTTPS certificate files:', error);
      return null;
    }
  },
  
  /**
   * Creates an HTTPS server with Express application
   * @param app Express application
   * @returns HTTPS server or null if not enabled/available
   */
  createServer(app: any): https.Server | null {
    const options = this.getOptions();
    
    if (!options) {
      return null;
    }
    
    return https.createServer(options, app);
  }
};

export default httpsConfig; 