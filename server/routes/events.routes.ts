import { Router, Request, Response } from 'express';
import { db } from '../db/index';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { verifyAdmin, AuthRequest } from '../middleware/auth.middleware';
import { logAudit, stripTimestampsKeepId, publicCache } from './helpers';

const router = Router();

// Public: list published events
router.get('/api/events', publicCache(30), async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.events);
        // Strip google_form_url from public response — it's only accessible after payment
        res.json(all.map(({ google_form_url, ...event }) => event));
    } catch {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Public: get event by id
router.get('/api/events/:id', publicCache(30), async (req: Request, res: Response) => {
    try {
        const [event] = await db.select().from(schema.events).where(eq(schema.events.id, req.params.id)).limit(1);
        if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
        // Strip google_form_url from public response
        const { google_form_url, ...safeEvent } = event;
        res.json(safeEvent);
    } catch {
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

// Admin: Create event
router.post('/api/admin/events', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const body = stripTimestampsKeepId(req.body);
        const id = body.id || body.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (!id) { res.status(400).json({ success: false, error: 'Event ID or title is required' }); return; }

        // Check if event with this ID already exists
        const [existing] = await db.select().from(schema.events).where(eq(schema.events.id, id)).limit(1);
        if (existing) {
            res.status(409).json({ success: false, error: `An event with ID "${id}" already exists. Please use a different title or ID.` });
            return;
        }

        const eventData = {
            ...body,
            id,
            created_at: new Date(),
            updated_at: new Date(),
        } as any;
        const [created] = await db.insert(schema.events).values(eventData).returning();
        await logAudit(req, 'create', 'event', created.id, null, created);
        res.status(201).json({ success: true, data: created });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create event';
        logger.error('Failed to create event', { error: message });
        res.status(500).json({ success: false, error: message });
    }
});

// Admin: Update event
router.put('/api/admin/events/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [existing] = await db.select().from(schema.events).where(eq(schema.events.id, req.params.id)).limit(1);
        if (!existing) { res.status(404).json({ success: false, error: 'Event not found' }); return; }
        const [updated] = await db.update(schema.events).set({ ...stripTimestampsKeepId(req.body), updated_at: new Date() } as any).where(eq(schema.events.id, req.params.id)).returning();
        await logAudit(req, 'update', 'event', updated.id, existing, updated);
        res.json({ success: true, data: updated });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update event';
        logger.error('Failed to update event', { error: message });
        res.status(500).json({ success: false, error: message });
    }
});

// Admin: Toggle publish/disable
router.patch('/api/admin/events/:id/toggle', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [event] = await db.select().from(schema.events).where(eq(schema.events.id, req.params.id)).limit(1);
        if (!event) { res.status(404).json({ success: false, error: 'Event not found' }); return; }
        const [updated] = await db.update(schema.events).set({ is_published: !event.is_published, updated_at: new Date() }).where(eq(schema.events.id, req.params.id)).returning();
        await logAudit(req, 'toggle_publish', 'event', updated.id, { is_published: event.is_published }, { is_published: updated.is_published });
        res.json({ success: true, data: updated });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to toggle event';
        logger.error('Failed to toggle event', { error: message });
        res.status(500).json({ success: false, error: message });
    }
});

// Admin: Purge ALL events (hard delete everything — use with caution)
router.post('/api/admin/purge-events', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const allEvents = await db.select().from(schema.events);
        await db.delete(schema.events);
        await logAudit(req, 'purge_all', 'event', null, { count: allEvents.length }, null);
        logger.info(`Purged all ${allEvents.length} events from database`);
        res.json({ success: true, message: `Deleted ${allEvents.length} events` });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to purge events';
        logger.error('Failed to purge events', { error: message });
        res.status(500).json({ success: false, error: message });
    }
});

// Admin: Delete event (permanent)
router.delete('/api/admin/events/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [event] = await db.select().from(schema.events).where(eq(schema.events.id, req.params.id)).limit(1);
        if (!event) { res.status(404).json({ success: false, error: 'Event not found' }); return; }
        await db.delete(schema.events).where(eq(schema.events.id, req.params.id));
        await logAudit(req, 'delete', 'event', req.params.id, event, null);
        res.json({ success: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete event';
        logger.error('Failed to delete event', { error: message });
        res.status(500).json({ success: false, error: message });
    }
});

export default router;
