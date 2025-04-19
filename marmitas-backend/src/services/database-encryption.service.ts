import { encryptionService } from '../utils/encryption.utils.js';
import { logger } from '../utils/logger.utils.js';

/**
 * Database field encryption service
 * 
 * Handles encryption and decryption of sensitive data fields
 * before they are stored in or retrieved from the database
 */
export class DatabaseEncryptionService {
  /**
   * List of database fields that should be encrypted
   * Format: { [tableName]: [fieldNames] }
   */
  private sensitiveFields: Record<string, string[]> = {
    // User related sensitive data
    profiles: ['phone', 'document_number', 'personal_notes'],
    user_addresses: ['phone', 'address_details'],
    user_verifications: ['verification_data'],
    
    // Payment related sensitive data
    payment_methods: ['card_number', 'card_holder_name', 'card_cvv'],
    orders: ['customer_notes', 'payment_details'],
    
    // Other sensitive data
    messages: ['content'],
    support_tickets: ['description']
  };

  /**
   * Check if a field should be encrypted
   * @param tableName Database table name
   * @param fieldName Field name
   * @returns True if the field should be encrypted
   */
  isSensitiveField(tableName: string, fieldName: string): boolean {
    return this.sensitiveFields[tableName]?.includes(fieldName) || false;
  }

  /**
   * Encrypt a database record's sensitive fields
   * @param tableName Database table name
   * @param record Database record to encrypt
   * @returns Record with encrypted sensitive fields
   */
  encryptRecord<T extends Record<string, any>>(tableName: string, record: T): T {
    if (!encryptionService.isInitialized()) {
      logger.warn('Encryption service not initialized, storing data unencrypted', { tableName });
      return record;
    }

    const sensitiveFields = this.sensitiveFields[tableName] || [];
    if (sensitiveFields.length === 0) {
      return record;
    }

    const result = { ...record };
    
    for (const field of sensitiveFields) {
      if (result[field] && typeof result[field] === 'string') {
        const encrypted = encryptionService.encrypt(result[field]);
        if (encrypted) {
          (result as Record<string, any>)[field] = encrypted;
        } else {
          logger.error('Failed to encrypt field', { tableName, field });
        }
      }
    }

    return result;
  }

  /**
   * Decrypt a database record's sensitive fields
   * @param tableName Database table name
   * @param record Database record to decrypt
   * @returns Record with decrypted sensitive fields
   */
  decryptRecord<T extends Record<string, any>>(tableName: string, record: T): T {
    if (!encryptionService.isInitialized()) {
      logger.warn('Encryption service not initialized, returning data as is', { tableName });
      return record;
    }

    const sensitiveFields = this.sensitiveFields[tableName] || [];
    if (sensitiveFields.length === 0) {
      return record;
    }

    const result = { ...record };
    
    for (const field of sensitiveFields) {
      if (result[field] && typeof result[field] === 'string' && this.isEncryptedData(result[field])) {
        const decrypted = encryptionService.decrypt(result[field]);
        if (decrypted) {
          (result as Record<string, any>)[field] = decrypted;
        } else {
          logger.error('Failed to decrypt field', { tableName, field });
        }
      }
    }

    return result;
  }

  /**
   * Check if a string appears to be encrypted data
   * @param data Data to check
   * @returns True if the data appears to be encrypted
   */
  private isEncryptedData(data: string): boolean {
    // Check if the data follows our encryption format: iv:authTag:encryptedData
    const parts = data.split(':');
    return parts.length === 3 && 
           parts[0].length === 32 && // IV length (16 bytes as hex)
           parts[1].length === 32;   // Auth tag length (16 bytes as hex)
  }

  /**
   * Encrypt multiple database records
   * @param tableName Database table name
   * @param records Array of records to encrypt
   * @returns Array of records with encrypted sensitive fields
   */
  encryptRecords<T extends Record<string, any>>(tableName: string, records: T[]): T[] {
    return records.map(record => this.encryptRecord(tableName, record));
  }

  /**
   * Decrypt multiple database records
   * @param tableName Database table name
   * @param records Array of records to decrypt
   * @returns Array of records with decrypted sensitive fields
   */
  decryptRecords<T extends Record<string, any>>(tableName: string, records: T[]): T[] {
    return records.map(record => this.decryptRecord(tableName, record));
  }
}

// Export singleton instance
export const databaseEncryptionService = new DatabaseEncryptionService(); 