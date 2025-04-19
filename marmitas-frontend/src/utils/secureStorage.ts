/**
 * Secure Storage Utility
 * 
 * Provides encryption for sensitive data stored in browser storage
 * Uses the Web Crypto API for cryptographic operations
 */

// Encryption constants
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits
const SALT_LENGTH = 16;
const ITERATION_COUNT = 100000;

/**
 * Class to handle secure storage operations
 */
export class SecureStorage {
  private masterKey: CryptoKey | null = null;
  private initialized = false;
  private storagePrefix = 'secure_';
  private ready: Promise<boolean>;

  constructor() {
    // Initialize the secure storage
    this.ready = this.initialize();
  }

  /**
   * Initialize the secure storage by deriving the master key
   * @returns Promise that resolves when initialization is complete
   */
  private async initialize(): Promise<boolean> {
    try {
      // Check if Web Crypto API is available
      if (!window.crypto || !window.crypto.subtle) {
        console.error('Web Crypto API is not available in this browser');
        return false;
      }

      // Get or create the master password
      const masterPassword = await this.getMasterPassword();
      
      // Convert the master password to a key
      const masterKeyMaterial = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(masterPassword),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      // Create a salt for key derivation
      const salt = await this.getSalt();

      // Derive the master key
      this.masterKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: ITERATION_COUNT,
          hash: 'SHA-256'
        },
        masterKeyMaterial,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
      );

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize secure storage:', error);
      return false;
    }
  }

  /**
   * Get the master password (in a real app, this would be user-provided)
   * For this implementation, we use a combination of device info and a stored secret
   */
  private async getMasterPassword(): Promise<string> {
    // In a real app, this would be a user-provided password or a secure device key
    // For this demo, we're using a combination of browser info and a stored value
    
    // Get stored secret or generate a new one
    let storedSecret = localStorage.getItem('master_key_material');
    if (!storedSecret) {
      storedSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      localStorage.setItem('master_key_material', storedSecret);
    }
    
    // Combine with browser fingerprint data for added security
    const browserInfo = [
      navigator.userAgent,
      navigator.language,
      window.screen.colorDepth,
      window.screen.height * window.screen.width
    ].join('|');
    
    // Create a hash of the combined data
    const browserHash = await this.hashString(browserInfo);
    
    // Combine the browser hash with the stored secret
    return storedSecret + browserHash.slice(0, 16);
  }

  /**
   * Get or create a salt for key derivation
   */
  private async getSalt(): Promise<ArrayBuffer> {
    let saltString = localStorage.getItem('secure_storage_salt');
    
    if (!saltString) {
      // Generate a new random salt
      const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
      saltString = Array.from(salt)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      localStorage.setItem('secure_storage_salt', saltString);
    }
    
    // Convert the salt string back to Uint8Array
    const saltArray = new Uint8Array(SALT_LENGTH);
    for (let i = 0; i < SALT_LENGTH; i++) {
      saltArray[i] = parseInt(saltString.slice(i * 2, i * 2 + 2), 16);
    }
    
    return saltArray.buffer;
  }

  /**
   * Create a hash of a string
   * @param data String to hash
   * @returns Promise resolving to a hex string hash
   */
  private async hashString(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypt and store data in localStorage
   * @param key Storage key
   * @param data Data to encrypt and store
   * @returns Promise that resolves when data is stored
   */
  async setItem(key: string, data: any): Promise<boolean> {
    try {
      // Wait for initialization to complete
      await this.ready;
      
      if (!this.initialized || !this.masterKey) {
        console.error('Secure storage not initialized');
        return false;
      }

      // Convert data to string if it's not already
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const dataBuffer = new TextEncoder().encode(dataString);
      
      // Generate a random IV for this encryption
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
      
      // Encrypt the data
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: ALGORITHM,
          iv
        },
        this.masterKey,
        dataBuffer
      );
      
      // Convert encrypted data to Base64
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const encryptedBase64 = btoa(
        Array.from(encryptedArray)
          .map(byte => String.fromCharCode(byte))
          .join('')
      );
      
      // Convert IV to Base64
      const ivBase64 = btoa(
        Array.from(iv)
          .map(byte => String.fromCharCode(byte))
          .join('')
      );
      
      // Store the IV and encrypted data
      const storageData = JSON.stringify({
        iv: ivBase64,
        data: encryptedBase64,
        created: Date.now()
      });
      
      localStorage.setItem(this.storagePrefix + key, storageData);
      return true;
    } catch (error) {
      console.error('Error encrypting data:', error);
      return false;
    }
  }

  /**
   * Retrieve and decrypt data from localStorage
   * @param key Storage key
   * @returns Promise that resolves to the decrypted data or null
   */
  async getItem<T = any>(key: string): Promise<T | null> {
    try {
      // Wait for initialization to complete
      await this.ready;
      
      if (!this.initialized || !this.masterKey) {
        console.error('Secure storage not initialized');
        return null;
      }
      
      // Get the stored data
      const storageItem = localStorage.getItem(this.storagePrefix + key);
      if (!storageItem) {
        return null;
      }
      
      // Parse the storage data
      const storageData = JSON.parse(storageItem);
      
      // Get IV and encrypted data
      const iv = new Uint8Array(
        atob(storageData.iv)
          .split('')
          .map(char => char.charCodeAt(0))
      );
      
      const encryptedData = new Uint8Array(
        atob(storageData.data)
          .split('')
          .map(char => char.charCodeAt(0))
      );
      
      // Decrypt the data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: ALGORITHM,
          iv
        },
        this.masterKey,
        encryptedData
      );
      
      // Convert the decrypted data back to a string
      const decryptedString = new TextDecoder().decode(decryptedBuffer);
      
      // Try to parse as JSON if possible
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString as unknown as T;
      }
    } catch (error) {
      console.error('Error decrypting data:', error);
      return null;
    }
  }

  /**
   * Remove an item from secure storage
   * @param key Storage key
   */
  removeItem(key: string): void {
    localStorage.removeItem(this.storagePrefix + key);
  }

  /**
   * Clear all items from secure storage
   */
  clear(): void {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage(); 