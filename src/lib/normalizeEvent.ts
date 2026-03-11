import { VoxeraEvent } from '../data/events';

/**
 * Compute a human-readable participation type from team_size_min/max.
 */
function computeTeamSize(e: Record<string, unknown>): string {
    // Prefer explicit team_size if set by legacy data
    const legacy = (e.team_size || e.teamSize || '') as string;
    const min = Number(e.team_size_min) || 1;
    const max = Number(e.team_size_max) || 1;

    // If min/max are both defaults (1/1), fall back to legacy or "Individual"
    if (min === 1 && max === 1) return legacy || 'Individual';
    if (min === 1 && max > 1) return legacy || `Solo or Team (up to ${max})`;
    if (min === max) return legacy || `Team of ${min}`;
    return legacy || `Team of ${min}-${max}`;
}

/**
 * Normalizes a raw event object from the API (which may use snake_case)
 * into the VoxeraEvent type used by the frontend (camelCase).
 */
export function normalizeEvent(e: Record<string, unknown>): VoxeraEvent {
    return {
        ...e,
        shortDescription: (e.short_description || e.shortDescription || '') as string,
        teamSize: computeTeamSize(e),
    } as VoxeraEvent;
}
