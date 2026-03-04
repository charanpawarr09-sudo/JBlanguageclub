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
 *   film-screening: ₹80 per crew member
 */

interface FeeRule {
    eventId: string;
    minTeamSize: number;
    maxTeamSize: number;
}

const FEE_RULES: Record<string, FeeRule> = {
    'debate-competition': { eventId: 'debate-competition', minTeamSize: 1, maxTeamSize: 2 },
    'treasure-hunt': { eventId: 'treasure-hunt', minTeamSize: 1, maxTeamSize: 1 },
    'pitch-perfect': { eventId: 'pitch-perfect', minTeamSize: 1, maxTeamSize: 4 },
    'open-mic': { eventId: 'open-mic', minTeamSize: 1, maxTeamSize: 2 },
    'poetry-reciting': { eventId: 'poetry-reciting', minTeamSize: 1, maxTeamSize: 1 },
    'film-screening': { eventId: 'film-screening', minTeamSize: 1, maxTeamSize: 10 },
};

/**
 * Calculate the registration fee for a given event and team size.
 * Returns the fee in INR (whole rupees, not paise).
 *
 * @param eventId - The ID of the event
 * @param teamSize - Number of people in the team (minimum 1)
 * @throws Error if eventId is unknown or teamSize is out of range
 */
export function calculateFee(eventId: string, teamSize: number): number {
    const rule = FEE_RULES[eventId];
    if (!rule) {
        throw new Error(`Unknown event: ${eventId}`);
    }

    if (teamSize < rule.minTeamSize || teamSize > rule.maxTeamSize) {
        throw new Error(
            `Invalid team size ${teamSize} for event "${eventId}". ` +
            `Expected ${rule.minTeamSize}–${rule.maxTeamSize}.`
        );
    }

    switch (eventId) {
        case 'debate-competition':
            return teamSize === 1 ? 99 : 150;

        case 'treasure-hunt':
            return 120; // Fixed per team regardless of member count

        case 'pitch-perfect':
            return 50; // Fixed flat fee

        case 'open-mic':
            return teamSize === 1 ? 99 : 150;

        case 'poetry-reciting':
            return 99 * teamSize; // Per person

        case 'film-screening':
            return 80 * teamSize; // Per crew member

        default:
            throw new Error(`Unknown event: ${eventId}`);
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
