import { describe, it, expect } from 'vitest';
import { calculateFee, toPaise, toRupees, validateTeamSize } from './fees';

describe('toPaise', () => {
    it('converts rupees to paise', () => {
        expect(toPaise(100)).toBe(10000);
        expect(toPaise(0)).toBe(0);
        expect(toPaise(49.99)).toBe(4999);
    });
});

describe('toRupees', () => {
    it('converts paise to rupees', () => {
        expect(toRupees(10000)).toBe(100);
        expect(toRupees(0)).toBe(0);
        expect(toRupees(4999)).toBe(49.99);
    });
});

describe('validateTeamSize', () => {
    it('returns valid=true for solo (team_size=1) on individual events', () => {
        const result = validateTeamSize('poetry-reciting', 1);
        expect(result.valid).toBe(true);
        expect(result.min).toBe(1);
        expect(result.max).toBe(1);
    });

    it('returns valid=false for team_size > max', () => {
        const result = validateTeamSize('debate-competition', 3);
        expect(result.valid).toBe(false);
    });

    it('returns valid=false for unknown event', () => {
        const result = validateTeamSize('nonexistent-event', 1);
        expect(result.valid).toBe(false);
        expect(result.min).toBe(0);
        expect(result.max).toBe(0);
    });

    it('returns valid=false for team_size=0', () => {
        const result = validateTeamSize('open-mic', 0);
        expect(result.valid).toBe(false);
    });
});

describe('calculateFee', () => {
    it('returns ₹99 for debate-competition solo', () => {
        expect(calculateFee('debate-competition', 1)).toBe(99);
    });

    it('returns ₹150 for debate-competition duo', () => {
        expect(calculateFee('debate-competition', 2)).toBe(150);
    });

    it('returns ₹120 for treasure-hunt (fixed)', () => {
        expect(calculateFee('treasure-hunt', 1)).toBe(120);
    });

    it('returns ₹50 for pitch-perfect (flat)', () => {
        expect(calculateFee('pitch-perfect', 1)).toBe(50);
    });

    it('returns ₹99 for open-mic solo', () => {
        expect(calculateFee('open-mic', 1)).toBe(99);
    });

    it('returns ₹150 for open-mic duo', () => {
        expect(calculateFee('open-mic', 2)).toBe(150);
    });

    it('returns ₹99 per person for poetry-reciting', () => {
        expect(calculateFee('poetry-reciting', 1)).toBe(99);
    });

    it('scales with team size for film-screening', () => {
        expect(calculateFee('film-screening', 1)).toBe(80);
        expect(calculateFee('film-screening', 3)).toBe(240);
        expect(calculateFee('film-screening', 5)).toBe(400);
    });

    it('throws for unknown events', () => {
        expect(() => calculateFee('unknown-event-xyz', 1)).toThrow('Unknown event');
    });

    it('throws for out-of-range team size', () => {
        expect(() => calculateFee('debate-competition', 5)).toThrow('Invalid team size');
    });

    it('roundtrips with toPaise/toRupees', () => {
        const fee = calculateFee('open-mic', 1);
        expect(toRupees(toPaise(fee))).toBe(fee);
    });
});
