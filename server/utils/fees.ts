/**
 * AUTHORITATIVE server-side fee calculation.
 * All fees in Indian Rupees (₹).
 * This is the ONLY source of truth for payment amounts.
 * Never trust fee amounts sent from the client.
 *
 * Fee schedule per PRD §5.4:
 *   debate-competition: single=₹99, team of 2=₹150
 *   treasure-hunt: team=₹120 (fixed, 4 members)
 *   pitch-perfect: flat=₹50
 *   open-mic: single=₹99, duo=₹150
 *   poetry-reciting: ₹99 per person (individual only)
 *   film-screening: per-film price (stored in rounds JSONB), default ₹80
 */

interface FeeRule {
    eventId: string;
    minTeamSize: number;
    maxTeamSize: number;
}

const FEE_RULES: Record<string, FeeRule> = {
    'debate-competition': { eventId: 'debate-competition', minTeamSize: 1, maxTeamSize: 2 },
    'treasure-hunt': { eventId: 'treasure-hunt', minTeamSize: 1, maxTeamSize: 1 },
    'pitch-perfect': { eventId: 'pitch-perfect', minTeamSize: 1, maxTeamSize: 2 },
    'open-mic': { eventId: 'open-mic', minTeamSize: 1, maxTeamSize: 2 },
    'poetry-reciting': { eventId: 'poetry-reciting', minTeamSize: 1, maxTeamSize: 1 },
    'film-screening': { eventId: 'film-screening', minTeamSize: 1, maxTeamSize: 1 },
};

/**
 * Calculate the registration fee for a given event and team size.
 * Returns the fee in INR (whole rupees, not paise).
 *
 * @param event - The Event record object (from DB or local constants)
 * @param teamSize - Number of people in the team (minimum 1)
 * @param roundFee - Optional per-round fee. For film-screening, overrides default.
 * @throws Error if teamSize is out of range
 */
export function calculateFee(event: any, teamSize: number, roundFee?: number): number {
    if (!event) throw new Error("Event is required for fee calculation");

    // Film screening specific logic
    if (event.id === 'film-screening') {
        return roundFee ?? event.registration_fee_single ?? 80;
    }

    const minTeamSize = event.team_size_min ?? 1;
    const maxTeamSize = event.team_size_max ?? 1;

    if (teamSize < minTeamSize || teamSize > maxTeamSize) {
        throw new Error(
            `Invalid team size ${teamSize} for event "${event.title || event.id}". ` +
            `Expected ${minTeamSize}–${maxTeamSize}.`
        );
    }

    if (teamSize === 1) {
        return event.registration_fee_single ?? 0;
    } else {
        // If it's a team, use registration_fee_team if provided, otherwise default to single * teamSize
        return event.registration_fee_team ?? ((event.registration_fee_single ?? 0) * teamSize);
    }
}

/**
 * Convert a whole-rupee amount to paise (for Razorpay).
 * Razorpay expects amounts in the smallest currency unit (paise = INR × 100).
 */
export function toPaise(amountINR: number): number {
    return Math.round(amountINR * 100);
}

/**
 * Convert paise back to rupees for display.
 */
export function toRupees(amountPaise: number): number {
    return amountPaise / 100;
}

/**
 * Validate that a team size is within the allowed range for an event.
 * Returns { valid, min, max } — useful for error messages.
 */
export function validateTeamSize(eventId: string, teamSize: number): {
    valid: boolean;
    min: number;
    max: number;
} {
    const rule = FEE_RULES[eventId];
    if (!rule) {
        return { valid: false, min: 0, max: 0 };
    }
    return {
        valid: teamSize >= rule.minTeamSize && teamSize <= rule.maxTeamSize,
        min: rule.minTeamSize,
        max: rule.maxTeamSize,
    };
}
