/**
 * Field-Level Encryption Utility
 * Encrypts sensitive data (PII) at rest
 *
 * MEDIUM FIX 3.3.6: Field-Level Encryption for Sensitive Data
 * Enables GDPR/CCPA compliance, secures PII storage
 */

import crypto from 'crypto';
import { config } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt sensitive data
 * @param plaintext - Data to encrypt
 * @returns Encrypted string format: "iv:salt:authTag:ciphertext"
 */
export function encryptField(plaintext: string): string {
  if (!plaintext) return plaintext;

  try {
    // Generate random IV and salt
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derive key from master key and salt
    const encryptionKey = process.env.ENCRYPTION_KEY || config.jwt.secret;
    const key = crypto.pbkdf2Sync(
      encryptionKey,
      salt,
      100000,
      32,
      'sha256'
    );

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Return in format: iv:salt:authTag:ciphertext
    return `${iv.toString('hex')}:${salt.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt field');
  }
}

/**
 * Decrypt sensitive data
 * @param encrypted - Encrypted string from encryptField
 * @returns Decrypted plaintext
 */
export function decryptField(encrypted: string): string {
  if (!encrypted) return encrypted;

  try {
    // Parse format: iv:salt:authTag:ciphertext
    const parts = encrypted.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const salt = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const ciphertext = parts[3];

    // Derive key from master key and salt
    const encryptionKey = process.env.ENCRYPTION_KEY || config.jwt.secret;
    const key = crypto.pbkdf2Sync(
      encryptionKey,
      salt,
      100000,
      32,
      'sha256'
    );

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt field');
  }
}

/**
 * Hash sensitive data (for storage without decryption capability)
 * @param plaintext - Data to hash
 * @returns Salted hash
 */
export function hashField(plaintext: string): string {
  const hashSalt = process.env.HASH_SALT || config.jwt.secret.slice(0, 16);
  return crypto
    .pbkdf2Sync(plaintext, hashSalt, 100000, 64, 'sha256')
    .toString('hex');
}

/**
 * Compare plaintext with hashed value
 * @param plaintext - Plaintext to verify
 * @param hash - Stored hash
 * @returns True if match
 */
export function compareHashedField(plaintext: string, hash: string): boolean {
  const computed = hashField(plaintext);
  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(hash)
  );
}

/**
 * Mask sensitive field in logs
 * @param value - Value to mask
 * @param visibleChars - Number of chars to show at end
 * @returns Masked value
 */
export function maskField(value: string, visibleChars = 4): string {
  if (!value || value.length <= visibleChars) return '****';
  return '*'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
}

/**
 * Check if field looks like sensitive data
 */
export function isSensitiveField(fieldName: string): boolean {
  const sensitivePatterns = [
    'password',
    'secret',
    'token',
    'key',
    'ssn',
    'pan',
    'account',
    'bank',
    'phone',
    'email',
    'card',
    'credit',
    'debit'
  ];

  return sensitivePatterns.some(pattern =>
    fieldName.toLowerCase().includes(pattern)
  );
}
