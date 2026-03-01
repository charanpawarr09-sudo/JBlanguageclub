import { describe, it, expect } from 'vitest';
import { generateRegistrationCode } from './codes';

describe('generateRegistrationCode', () => {
    it('returns a string', () => {
        const code = generateRegistrationCode();
        expect(typeof code).toBe('string');
    });

    it('has correct length (VOX- prefix + 8 chars)', () => {
        const code = generateRegistrationCode();
        expect(code).toMatch(/^VOX-/);
        expect(code.length).toBe(12); // "VOX-" (4) + 8 chars
    });

    it('does not contain ambiguous characters', () => {
        // Run multiple times to catch random issues
        for (let i = 0; i < 100; i++) {
            const code = generateRegistrationCode();
            const suffix = code.substring(4); // Remove "VOX-" prefix
            expect(suffix).not.toMatch(/[0OIl1]/);
        }
    });

    it('generates unique codes', () => {
        const codes = new Set<string>();
        for (let i = 0; i < 1000; i++) {
            codes.add(generateRegistrationCode());
        }
        // With 1000 codes, we should have very close to 1000 unique ones
        expect(codes.size).toBeGreaterThanOrEqual(995);
    });

    it('only contains uppercase letters and digits in suffix', () => {
        for (let i = 0; i < 50; i++) {
            const code = generateRegistrationCode();
            const suffix = code.substring(4);
            expect(suffix).toMatch(/^[A-Z0-9]+$/);
        }
    });
});
