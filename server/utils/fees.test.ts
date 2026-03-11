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
    const debateEvent = { id: 'debate-competition', registration_fee_single: 99, registration_fee_team: 150, team_size_min: 1, team_size_max: 2 };
    const treasureEvent = { id: 'treasure-hunt', registration_fee_single: 120, registration_fee_team: 120, team_size_min: 1, team_size_max: 1 };
    const pitchEvent = { id: 'pitch-perfect', registration_fee_single: 50, registration_fee_team: 50, team_size_min: 1, team_size_max: 4 };
    const openMicEvent = { id: 'open-mic', registration_fee_single: 99, registration_fee_team: 150, team_size_min: 1, team_size_max: 2 };
    const filmEvent = { id: 'film-screening', registration_fee_single: 80, team_size_min: 1, team_size_max: 1 };

    it('returns ₹99 for debate-competition solo', () => {
        expect(calculateFee(debateEvent, 1)).toBe(99);
    });

    it('returns ₹150 for debate-competition duo', () => {
        expect(calculateFee(debateEvent, 2)).toBe(150);
    });

    it('returns ₹120 for treasure-hunt (fixed)', () => {
        expect(calculateFee(treasureEvent, 1)).toBe(120);
    });

    it('returns ₹50 for pitch-perfect (flat)', () => {
        expect(calculateFee(pitchEvent, 1)).toBe(50);
    });

    it('returns ₹99 for open-mic solo', () => {
        expect(calculateFee(openMicEvent, 1)).toBe(99);
    });

    it('returns ₹150 for open-mic duo', () => {
        expect(calculateFee(openMicEvent, 2)).toBe(150);
    });

    it('returns default ₹80 for film-screening', () => {
        expect(calculateFee(filmEvent, 1)).toBe(80);
    });

    it('uses roundFee when provided for film-screening', () => {
        expect(calculateFee(filmEvent, 1, 50)).toBe(50);
        expect(calculateFee(filmEvent, 1, 120)).toBe(120);
    });

    it('throws if event is omitted', () => {
        expect(() => calculateFee(null, 1)).toThrow('Event is required');
    });

    it('throws for out-of-range team size', () => {
        expect(() => calculateFee(debateEvent, 5)).toThrow('Invalid team size');
    });

    it('roundtrips with toPaise/toRupees', () => {
        const fee = calculateFee(openMicEvent, 1);
        expect(toRupees(toPaise(fee))).toBe(fee);
    });
});
