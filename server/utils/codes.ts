import { randomBytes } from 'crypto';

/**
 * Generate a human-friendly registration code.
 * Format: VOX-XXXXXXXX (e.g. VOX-A3K9M2PQ)
 */
export function generateRegistrationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I,O,0,1 to avoid confusion
    let code = '';
    const bytes = randomBytes(8);
    for (let i = 0; i < 8; i++) {
        code += chars[bytes[i] % chars.length];
    }
    return `VOX-${code}`;
}
