// PIN utility functions for asset management

/**
 * Hash a 4-digit PIN using SHA-256
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a PIN against a stored hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const pinHash = await hashPin(pin);
  return pinHash === hash;
}

/**
 * Validate PIN format (must be exactly 4 digits)
 */
export function validatePinFormat(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/**
 * Check if two PINs match (for confirmation)
 */
export function pinsMatch(pin1: string, pin2: string): boolean {
  return pin1 === pin2;
}
