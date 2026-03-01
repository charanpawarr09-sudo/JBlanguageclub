/**
 * Client-side fee reference for DISPLAY ONLY.
 * Never trust these values for payment — the server calculates the authoritative fee.
 * All amounts in Indian Rupees (₹).
 */

export interface EventFeeConfig {
    eventId: string;
    eventTitle: string;
    feeType: 'fixed' | 'per-person' | 'tiered';
    singleFee: number;
    teamFee: number | null;
    minTeamSize: number;
    maxTeamSize: number;
    description: string;
}

export const REGISTRATION_FEES: Record<string, EventFeeConfig> = {
    'debate-competition': {
        eventId: 'debate-competition',
        eventTitle: 'Debate Competition',
        feeType: 'tiered',
        singleFee: 99,
        teamFee: 150,
        minTeamSize: 1,
        maxTeamSize: 2,
        description: '₹99 (Individual) · ₹150 (Team of 2)',
    },
    'treasure-hunt': {
        eventId: 'treasure-hunt',
        eventTitle: 'Treasure Hunt',
        feeType: 'fixed',
        singleFee: 120,
        teamFee: null,
        minTeamSize: 1,
        maxTeamSize: 1,
        description: '₹120 per person',
    },
    'pitch-perfect': {
        eventId: 'pitch-perfect',
        eventTitle: 'Pitch Perfect',
        feeType: 'fixed',
        singleFee: 50,
        teamFee: 50,
        minTeamSize: 1,
        maxTeamSize: 4,
        description: '₹50 flat fee (Individual or Team)',
    },
    'open-mic': {
        eventId: 'open-mic',
        eventTitle: 'Open Mic',
        feeType: 'tiered',
        singleFee: 99,
        teamFee: 150,
        minTeamSize: 1,
        maxTeamSize: 2,
        description: '₹99 (Solo) · ₹150 (Duo)',
    },
    'poetry-reciting': {
        eventId: 'poetry-reciting',
        eventTitle: 'Poetry Reciting',
        feeType: 'per-person',
        singleFee: 99,
        teamFee: null,
        minTeamSize: 1,
        maxTeamSize: 1,
        description: '₹99 per person',
    },
    'film-screening': {
        eventId: 'film-screening',
        eventTitle: 'Film Screening',
        feeType: 'per-person',
        singleFee: 80,
        teamFee: null,
        minTeamSize: 1,
        maxTeamSize: 10,
        description: '₹80 per crew member',
    },
};

/**
 * Get fee config for a given event.
 */
export function getEventFeeConfig(eventId: string): EventFeeConfig | undefined {
    return REGISTRATION_FEES[eventId];
}

/**
 * Calculate estimated display fee (not authoritative — server is source of truth).
 */
export function estimateFee(eventId: string, teamSize: number): number {
    const config = REGISTRATION_FEES[eventId];
    if (!config) return 0;

    switch (eventId) {
        case 'debate-competition':
            return teamSize === 1 ? 99 : 150;
        case 'treasure-hunt':
            return 120;
        case 'pitch-perfect':
            return 50;
        case 'open-mic':
            return teamSize === 1 ? 99 : 150;
        case 'poetry-reciting':
            return 99 * teamSize;
        case 'film-screening':
            return 80 * teamSize;
        default:
            return 0;
    }
}

/**
 * Get a display-friendly fee string for an event.
 * Examples: "₹99", "₹99 / person", "₹120 / team", "₹50"
 */
export function getDisplayFee(eventId: string, teamSize?: number): string {
    const config = REGISTRATION_FEES[eventId];
    if (!config) return '—';

    if (config.feeType === 'per-person') {
        return `₹${config.singleFee} / person`;
    }

    if (config.feeType === 'fixed') {
        if (config.minTeamSize === config.maxTeamSize && config.minTeamSize > 1) {
            return `₹${config.singleFee} / team`;
        }
        return `₹${config.singleFee}`;
    }

    // tiered
    if (teamSize && teamSize > 1 && config.teamFee) {
        return `₹${config.teamFee}`;
    }
    return `₹${config.singleFee}`;
}

/**
 * Format a fee amount in INR for display.
 */
export function formatINR(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
}
