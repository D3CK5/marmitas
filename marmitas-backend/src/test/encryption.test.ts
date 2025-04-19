import { encryptionService } from '../utils/encryption.utils.js';
import { databaseEncryptionService } from '../services/database-encryption.service.js';
import { keyRotationService } from '../services/key-rotation.service.js';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

/**
 * Test suite for data encryption implementation
 * 
 * These tests verify that encryption, decryption, and data protection
 * features are working correctly.
 */

async function runTests() {
  console.log('=== Running Encryption Tests ===');
  let succeeded = 0;
  let failed = 0;
  const total = 6;

  // Test 1: Basic encryption and decryption
  try {
    const testData = 'This is sensitive data to be encrypted';
    const encrypted = encryptionService.encrypt(testData);
    
    assert(encrypted !== null, 'Encryption should not return null');
    assert(encrypted !== testData, 'Encrypted data should be different from original');
    
    // Verify format (iv:authTag:encryptedData)
    const parts = encrypted!.split(':');
    assert(parts.length === 3, 'Encrypted format should be iv:authTag:encryptedData');
    
    // Test decryption
    const decrypted = encryptionService.decrypt(encrypted!);
    assert(decrypted === testData, 'Decryption should return the original data');
    
    console.log('✅ Test 1: Basic encryption and decryption - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 1: Basic encryption and decryption - FAILED', error);
    failed++;
  }

  // Test 2: Database field encryption
  try {
    const record = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890', // Should be encrypted
      document_number: '123.456.789-00', // Should be encrypted
      created_at: new Date().toISOString()
    };
    
    // Encrypt record
    const encryptedRecord = databaseEncryptionService.encryptRecord('profiles', record);
    
    assert(encryptedRecord.id === record.id, 'Non-sensitive fields should remain unchanged');
    assert(encryptedRecord.name === record.name, 'Non-sensitive fields should remain unchanged');
    assert(encryptedRecord.phone !== record.phone, 'Sensitive fields should be encrypted');
    assert(encryptedRecord.document_number !== record.document_number, 'Sensitive fields should be encrypted');
    
    // Decrypt record
    const decryptedRecord = databaseEncryptionService.decryptRecord('profiles', encryptedRecord);
    
    assert(decryptedRecord.phone === record.phone, 'Decrypted fields should match original');
    assert(decryptedRecord.document_number === record.document_number, 'Decrypted fields should match original');
    
    console.log('✅ Test 2: Database field encryption - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 2: Database field encryption - FAILED', error);
    failed++;
  }

  // Test 3: Key rotation
  try {
    // Force a key rotation
    const oldVersion = keyRotationService.getCurrentKeyVersion();
    const newVersion = keyRotationService.forceRotation();
    
    assert(newVersion > oldVersion, 'New key version should be greater than old version');
    
    // Verify the key file exists
    const keyPath = process.env.ENCRYPTION_KEY_PATH || 
      path.resolve(process.cwd(), '../infrastructure/keys/encryption.key');
    assert(fs.existsSync(keyPath), 'Key file should exist after rotation');
    
    // Verify backup file exists
    const backupDir = process.env.ENCRYPTION_KEY_BACKUP_DIR || 
      path.resolve(process.cwd(), '../infrastructure/keys/backup');
    const backupFile = path.join(backupDir, `key-v${oldVersion}.backup`);
    assert(fs.existsSync(backupFile), 'Backup key file should exist after rotation');
    
    console.log('✅ Test 3: Key rotation - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 3: Key rotation - FAILED', error);
    failed++;
  }

  // Test 4: Decryption with rotated keys
  try {
    // Encrypt data with current key
    const testData = 'Data to test with rotated keys';
    const encrypted = encryptionService.encrypt(testData);
    
    // Force key rotation
    keyRotationService.forceRotation();
    
    // Should still be able to decrypt with new key service instance
    const decrypted = encryptionService.decrypt(encrypted!);
    assert(decrypted === testData, 'Should be able to decrypt data after key rotation');
    
    console.log('✅ Test 4: Decryption with rotated keys - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 4: Decryption with rotated keys - FAILED', error);
    failed++;
  }

  // Test 5: Encryption of different data types
  try {
    // Test with special characters
    const specialData = 'áéíóú!@#$%^&*()\n\t';
    const specialEncrypted = encryptionService.encrypt(specialData);
    const specialDecrypted = encryptionService.decrypt(specialEncrypted!);
    assert(specialDecrypted === specialData, 'Should handle special characters correctly');
    
    // Test with longer content
    const longData = 'a'.repeat(10000); // 10KB of data
    const longEncrypted = encryptionService.encrypt(longData);
    const longDecrypted = encryptionService.decrypt(longEncrypted!);
    assert(longDecrypted === longData, 'Should handle long data correctly');
    
    console.log('✅ Test 5: Encryption of different data types - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 5: Encryption of different data types - FAILED', error);
    failed++;
  }

  // Test 6: Encryption failure handling
  try {
    // Try to encrypt with invalid key
    const testService = new (encryptionService as any).constructor();
    testService.encryptionKey = Buffer.from('invalid_key');
    testService.initialized = true;
    
    // This should not throw but return null
    const result = testService.encrypt('Test data');
    assert(result === null, 'Should gracefully handle encryption failure');
    
    console.log('✅ Test 6: Encryption failure handling - PASSED');
    succeeded++;
  } catch (error) {
    console.error('❌ Test 6: Encryption failure handling - FAILED', error);
    failed++;
  }

  // Print test summary
  console.log('\n=== Encryption Test Results ===');
  console.log(`Total: ${total}, Passed: ${succeeded}, Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('✅ All encryption tests passed!');
    return true;
  } else {
    console.log('❌ Some encryption tests failed');
    return false;
  }
}

// Run tests directly if this file is executed
if (require.main === module) {
  runTests().then(passed => {
    if (!passed) {
      process.exit(1);
    }
  }).catch(error => {
    console.error('Error running encryption tests:', error);
    process.exit(1);
  });
}

export { runTests }; 