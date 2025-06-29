// Encryption constants
const ENCRYPTION_KEY = 'analytics-encryption-key-2024';
const SENSITIVE_FIELDS = ['siteName', 'siteId'];

// Encryption utility functions

export const generateEncryptionKey = async (): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(ENCRYPTION_KEY),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('analytics-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  };
  
  const encryptData = async (data: any): Promise<string> => {
    try {
      const key = await generateEncryptionKey();
      const encoder = new TextEncoder();
      const jsonString = JSON.stringify(data);
      const dataBuffer = encoder.encode(jsonString);
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      );
      
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const combined = new Uint8Array(iv.length + encryptedArray.length);
      combined.set(iv);
      combined.set(encryptedArray, iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return JSON.stringify(data); // Fallback to plain text
    }
  };
  
   const decryptData = async (encryptedString: string): Promise<any> => {
    try {
      const key = await generateEncryptionKey();
      const decoder = new TextDecoder();
      
      const combined = new Uint8Array(
        atob(encryptedString).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
      );
      
      const decryptedString = decoder.decode(decryptedBuffer);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  };
  
  export const encryptSensitiveFields = async (data: any): Promise<any> => {
    const encryptedData = { ...data };
    
    for (const field of SENSITIVE_FIELDS) {
      if (encryptedData[field]) {
        encryptedData[field] = await encryptData(encryptedData[field]);
      }
    }
    
    return encryptedData;
  };
  
  export const decryptSensitiveFields = async (data: any): Promise<any> => {
    const decryptedData = { ...data };
    
    for (const field of SENSITIVE_FIELDS) {
      if (decryptedData[field] && typeof decryptedData[field] === 'string') {
        try {
          const decrypted = await decryptData(decryptedData[field]);
          if (decrypted !== null) {
            decryptedData[field] = decrypted;
          }
        } catch (error) {
          console.warn(`Failed to decrypt field ${field}:`, error);
        }
      }
    }
    
    return decryptedData;
  };