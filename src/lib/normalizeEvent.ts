import { VoxeraEvent } from '../data/events';

/**
 * Normalizes a raw event object from the API (which may use snake_case)
 * into the VoxeraEvent type used by the frontend (camelCase).
 */
export function normalizeEvent(e: Record<string, unknown>): VoxeraEvent {
    return {
        ...e,
        shortDescription: (e.short_description || e.shortDescription || '') as string,
        teamSize: (e.team_size || e.teamSize || '') as string,
    } as VoxeraEvent;
}
