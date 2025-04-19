import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../utils/logger.utils.js';
import { config } from '../config/app.config.js';

/**
 * Key Rotation Service
 * 
 * Manages encryption key rotation and backup for security best practices
 */
export class KeyRotationService {
  // Paths for key storage
  private keyPath: string;
  private keyBackupDir: string;
  private currentKeyVersion = 1;
  private rotationIntervalDays: number;
  private initialized = false;
  
  // Map of key versions for supporting decryption of data encrypted with previous keys
  private keyVersions: Map<number, Buffer> = new Map();
  
  constructor() {
    // Initialize paths
    this.keyPath = process.env.ENCRYPTION_KEY_PATH || 
      path.resolve(process.cwd(), '../infrastructure/keys/encryption.key');
    this.keyBackupDir = process.env.ENCRYPTION_KEY_BACKUP_DIR || 
      path.resolve(process.cwd(), '../infrastructure/keys/backup');
    
    // Set rotation interval (default: 90 days)
    this.rotationIntervalDays = config.security?.keyRotation?.keyRotationDays || 90;
    
    try {
      this.initialize();
    } catch (error) {
      logger.error('Failed to initialize key rotation service', { error });
    }
  }
  
  /**
   * Initialize the key rotation service
   */
  private initialize(): void {
    // Create key directories if they don't exist
    const keyDir = path.dirname(this.keyPath);
    if (!fs.existsSync(keyDir)) {
      fs.mkdirSync(keyDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.keyBackupDir)) {
      fs.mkdirSync(this.keyBackupDir, { recursive: true });
    }
    
    // Load keys or initialize if not present
    this.loadKeys();
    
    // Check if key rotation is needed
    this.checkRotation();
    
    // Set up scheduled key rotation check if automatic rotation is enabled
    if (config.security?.keyRotation?.automaticRotation === true) {
      setInterval(() => {
        this.checkRotation();
      }, 24 * 60 * 60 * 1000); // Check daily
    }
    
    this.initialized = true;
    logger.info('Key rotation service initialized', { 
      rotationIntervalDays: this.rotationIntervalDays,
      currentKeyVersion: this.currentKeyVersion
    });
  }
  
  /**
   * Load encryption keys
   */
  private loadKeys(): void {
    try {
      // Check for current encryption key
      if (fs.existsSync(this.keyPath)) {
        const keyData = fs.readFileSync(this.keyPath, 'utf8').trim();
        const [version, keyHex] = keyData.split(':');
        
        if (version && keyHex) {
          this.currentKeyVersion = parseInt(version, 10);
          this.keyVersions.set(this.currentKeyVersion, Buffer.from(keyHex, 'hex'));
        } else {
          // Legacy key format without version - assume version 1
          this.keyVersions.set(1, Buffer.from(keyData, 'hex'));
        }
      } else {
        // No key found - generate initial key
        this.rotateKey();
      }
      
      // Load backup keys for decryption support
      this.loadBackupKeys();
    } catch (error) {
      logger.error('Failed to load encryption keys', { error });
      throw error;
    }
  }
  
  /**
   * Load backup keys for decryption of data encrypted with previous keys
   */
  private loadBackupKeys(): void {
    try {
      if (!fs.existsSync(this.keyBackupDir)) {
        return;
      }
      
      const backupFiles = fs.readdirSync(this.keyBackupDir)
        .filter(file => file.match(/^key-v\d+\.backup$/));
      
      for (const file of backupFiles) {
        try {
          const keyData = fs.readFileSync(path.join(this.keyBackupDir, file), 'utf8').trim();
          const [version, keyHex] = keyData.split(':');
          
          if (version && keyHex) {
            const versionNum = parseInt(version, 10);
            if (!this.keyVersions.has(versionNum)) {
              this.keyVersions.set(versionNum, Buffer.from(keyHex, 'hex'));
              logger.info('Loaded backup key', { version: versionNum });
            }
          }
        } catch (err) {
          logger.warn(`Failed to load backup key ${file}`, { error: err });
        }
      }
    } catch (error) {
      logger.error('Failed to load backup keys', { error });
    }
  }
  
  /**
   * Check if key rotation is needed and perform rotation if necessary
   */
  private checkRotation(): void {
    try {
      // Get key file stats
      if (!fs.existsSync(this.keyPath)) {
        this.rotateKey();
        return;
      }
      
      const stats = fs.statSync(this.keyPath);
      const keyAge = Date.now() - stats.mtime.getTime();
      const keyAgeDays = keyAge / (1000 * 60 * 60 * 24);
      
      // Check if rotation is enabled and key age exceeds the rotation interval
      if (config.security?.keyRotation?.enabled === true && keyAgeDays >= this.rotationIntervalDays) {
        logger.info('Key rotation needed', { 
          keyAgeDays: Math.floor(keyAgeDays),
          rotationIntervalDays: this.rotationIntervalDays
        });
        this.rotateKey();
      } else {
        logger.debug('Key rotation not needed', { 
          keyAgeDays: Math.floor(keyAgeDays),
          daysRemaining: Math.floor(this.rotationIntervalDays - keyAgeDays)
        });
      }
    } catch (error) {
      logger.error('Error checking key rotation', { error });
    }
  }
  
  /**
   * Rotate the encryption key
   */
  private rotateKey(): void {
    try {
      // Backup the current key if it exists
      if (fs.existsSync(this.keyPath)) {
        const keyData = fs.readFileSync(this.keyPath, 'utf8');
        const backupFile = path.join(this.keyBackupDir, `key-v${this.currentKeyVersion}.backup`);
        fs.writeFileSync(backupFile, keyData);
        logger.info('Backed up encryption key', { version: this.currentKeyVersion });
      }
      
      // Generate new key version
      this.currentKeyVersion++;
      
      // Generate a new key - 32 bytes for AES-256
      const newKey = crypto.randomBytes(32);
      this.keyVersions.set(this.currentKeyVersion, newKey);
      
      // Save the key with version
      const keyData = `${this.currentKeyVersion}:${newKey.toString('hex')}`;
      fs.writeFileSync(this.keyPath, keyData);
      
      logger.info('Rotated encryption key', { newVersion: this.currentKeyVersion });
    } catch (error) {
      logger.error('Failed to rotate encryption key', { error });
      throw error;
    }
  }
  
  /**
   * Get the current encryption key
   * @returns Current encryption key
   */
  getCurrentKey(): Buffer | null {
    return this.keyVersions.get(this.currentKeyVersion) || null;
  }
  
  /**
   * Get a key by version
   * @param version Key version
   * @returns Encryption key or null if not found
   */
  getKeyByVersion(version: number): Buffer | null {
    return this.keyVersions.get(version) || null;
  }
  
  /**
   * Get current key version
   * @returns Current key version number
   */
  getCurrentKeyVersion(): number {
    return this.currentKeyVersion;
  }
  
  /**
   * Force immediate key rotation
   * @returns New key version number
   */
  forceRotation(): number {
    this.rotateKey();
    return this.currentKeyVersion;
  }
  
  /**
   * Check if the service is properly initialized
   * @returns true if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Start the key rotation service
   */
  public start(): void {
    logger.info('Starting key rotation service');
    
    // Perform initial check
    this.checkAndRotateKeysIfNeeded();
    
    // Configure scheduled checks
    if (config.security?.keyRotation?.automaticRotation === true) {
      this.scheduleRotationCheck();
      logger.info('Automatic key rotation is enabled, scheduled checks configured');
    } else {
      logger.info('Automatic key rotation is disabled, manual rotation will be required');
    }
  }

  /**
   * Check and rotate keys if needed
   */
  private async checkAndRotateKeysIfNeeded(): Promise<void> {
    try {
      const keyStats = await this.getKeyStats();
      
      if (!keyStats) {
        logger.warn('Could not get key stats, skipping rotation check');
        return;
      }
      
      const keyAgeDays = this.calculateKeyAgeDays(keyStats.createdAt);
      
      logger.info('Checking key rotation status', {
        keyAgeDays: Math.floor(keyAgeDays),
        rotationIntervalDays: this.rotationIntervalDays
      });
      
      if (config.security?.keyRotation?.enabled === true && keyAgeDays >= this.rotationIntervalDays) {
        // ... existing code ...
      }
    } catch (error) {
      logger.error('Error checking key rotation', { error });
    }
  }

  /**
   * Get key file stats
   */
  private async getKeyStats(): Promise<{ createdAt: Date } | null> {
    try {
      if (!fs.existsSync(this.keyPath)) {
        return null;
      }
      
      const stats = fs.statSync(this.keyPath);
      return {
        createdAt: stats.mtime
      };
    } catch (error) {
      logger.error('Failed to get key stats', { error });
      return null;
    }
  }

  /**
   * Calculate key age in days
   */
  private calculateKeyAgeDays(createdAt: Date): number {
    const keyAge = Date.now() - createdAt.getTime();
    return keyAge / (1000 * 60 * 60 * 24);
  }

  /**
   * Schedule rotation check
   */
  private scheduleRotationCheck(): void {
    // Schedule daily check
    setInterval(() => {
      this.checkAndRotateKeysIfNeeded();
    }, 24 * 60 * 60 * 1000);
    
    logger.info('Scheduled key rotation check');
  }
}

// Export singleton instance
export const keyRotationService = new KeyRotationService(); 