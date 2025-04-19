import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { logger } from './logger.utils.js';

/**
 * Encryption service for protecting sensitive data at rest
 * Uses AES-256-GCM encryption with secure key management
 */
export class EncryptionService {
  private encryptionKey: Buffer = Buffer.alloc(0); // Initialize with empty buffer
  private algorithm = 'aes-256-gcm';
  private keyPath: string;
  private initialized = false;

  constructor() {
    // Determine key storage location - in production this should use a secure key vault
    this.keyPath = process.env.ENCRYPTION_KEY_PATH || 
      path.resolve(process.cwd(), '../infrastructure/keys/encryption.key');
    
    try {
      this.initializeEncryptionKey();
    } catch (error) {
      logger.error('Failed to initialize encryption service', { error });
      // We don't throw here to allow application to start, but encryption won't work
    }
  }

  /**
   * Initialize encryption key - either load existing or generate new one
   * In production, this should use a secure key management system
   */
  private initializeEncryptionKey(): void {
    try {
      // Create directory if it doesn't exist
      const keyDir = path.dirname(this.keyPath);
      if (!fs.existsSync(keyDir)) {
        fs.mkdirSync(keyDir, { recursive: true });
      }

      // Check if key exists, if not generate a new one
      if (fs.existsSync(this.keyPath)) {
        this.encryptionKey = Buffer.from(fs.readFileSync(this.keyPath, 'utf8'), 'hex');
      } else {
        // Generate a new key - 32 bytes for AES-256
        this.encryptionKey = crypto.randomBytes(32);
        // Save the key to file - in hex format
        fs.writeFileSync(this.keyPath, this.encryptionKey.toString('hex'));
        
        logger.info('Generated new encryption key', { 
          keyPath: this.keyPath,
          keyLength: this.encryptionKey.length
        });
      }

      // Validate key
      if (this.encryptionKey.length !== 32) {
        throw new Error('Invalid encryption key length');
      }

      this.initialized = true;
      logger.info('Encryption service initialized successfully');
    } catch (error) {
      logger.error('Error initializing encryption key', { error });
      this.initialized = false;
      throw error;
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param data Data to encrypt
   * @returns Encrypted data with authentication tag and IV
   */
  encrypt(data: string): string | null {
    if (!this.initialized) {
      logger.error('Encryption service not initialized');
      return null;
    }

    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create cipher with explicit TypeScript casting
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv) as crypto.CipherGCM;
      
      // Encrypt data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      // Combine IV, authentication tag, and encrypted data
      // Format: iv:authTag:encryptedData
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      logger.error('Encryption failed', { error });
      return null;
    }
  }

  /**
   * Decrypt data encrypted with AES-256-GCM
   * @param encryptedData Encrypted data with authentication tag and IV
   * @returns Decrypted data or null if decryption fails
   */
  decrypt(encryptedData: string): string | null {
    if (!this.initialized) {
      logger.error('Encryption service not initialized');
      return null;
    }

    try {
      // Split the encrypted data into IV, authentication tag, and encrypted content
      const [ivHex, authTagHex, encryptedContent] = encryptedData.split(':');
      
      if (!ivHex || !authTagHex || !encryptedContent) {
        throw new Error('Invalid encrypted data format');
      }
      
      // Convert hex strings to buffers
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      // Create decipher with explicit TypeScript casting
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(authTag);
      
      // Decrypt data
      let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', { error });
      return null;
    }
  }

  /**
   * Hash data using SHA-256
   * @param data Data to hash
   * @returns SHA-256 hash as a hex string
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate a secure random token
   * @param length Length of the token in bytes (default: 32)
   * @returns Random token as a hex string
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Check if encryption service is properly initialized
   * @returns true if initialized, false otherwise
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService(); 