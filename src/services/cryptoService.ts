/**
 * Cryptographic Token Service for Dynamic QR Attendance
 * Implements HMAC-SHA256 signing, timestamp verification, and nonce protection
 * strictly following Section 6, 7.2, and Appendix B of the specification.
 */

const SECRET_KEY = 'attendance_system_production_secret_key_2026_qrauth_sec';
export const QR_VALIDITY_SECONDS = 25;

/**
 * Generate HMAC-SHA256 signature for token parts
 */
async function generateHmacSignature(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SECRET_KEY);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(payload)
  );
  
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

/**
 * Generates a signed dynamic QR token for an active lecture session
 * Format: session_id:issued_timestamp:nonce:signature
 */
export async function createDynamicQRToken(sessionId: string): Promise<{
  tokenString: string;
  issuedTimestamp: number;
  nonce: string;
  signature: string;
  expiresInSeconds: number;
}> {
  const issuedTimestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 10);
  const payloadToSign = `${sessionId}:${issuedTimestamp}:${nonce}`;
  const signature = await generateHmacSignature(payloadToSign);
  const tokenString = `${sessionId}:${issuedTimestamp}:${nonce}:${signature}`;

  return {
    tokenString,
    issuedTimestamp,
    nonce,
    signature,
    expiresInSeconds: QR_VALIDITY_SECONDS,
  };
}

/**
 * Validates a submitted QR token string
 */
export async function verifyTokenStructureAndAge(tokenString: string): Promise<{
  valid: boolean;
  code: number;
  message: string;
  sessionId?: string;
  ageSeconds?: number;
}> {
  if (!tokenString || typeof tokenString !== 'string') {
    return { valid: false, code: 400, message: 'Invalid token format or empty token' };
  }

  const parts = tokenString.trim().split(':');
  if (parts.length !== 4) {
    return { valid: false, code: 400, message: 'Malformed QR token: expected 4 segments' };
  }

  const [sessionId, rawTimestamp, nonce, signature] = parts;
  const issuedTimestamp = parseInt(rawTimestamp, 10);

  if (isNaN(issuedTimestamp) || !sessionId || !nonce || !signature) {
    return { valid: false, code: 400, message: 'Malformed QR token data types' };
  }

  // Check signature
  const expectedPayload = `${sessionId}:${issuedTimestamp}:${nonce}`;
  const expectedSignature = await generateHmacSignature(expectedPayload);

  if (signature !== expectedSignature) {
    return {
      valid: false,
      code: 400,
      message: 'Invalid QR token signature. Possible token tampering detected.',
      sessionId,
    };
  }

  // Check age (25 seconds window)
  const now = Date.now();
  const ageSeconds = Math.max(0, Math.floor((now - issuedTimestamp) / 1000));

  if (ageSeconds > QR_VALIDITY_SECONDS) {
    return {
      valid: false,
      code: 400,
      message: `QR code expired. Token age is ${ageSeconds}s (maximum allowed is ${QR_VALIDITY_SECONDS}s).`,
      sessionId,
      ageSeconds,
    };
  }

  return {
    valid: true,
    code: 200,
    message: 'Token signature and timestamp valid',
    sessionId,
    ageSeconds,
  };
}
