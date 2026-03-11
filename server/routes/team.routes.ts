import { Router, Request, Response } from 'express';
import { db } from '../db/index';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { verifyAdmin, AuthRequest } from '../middleware/auth.middleware';
import { logAudit, stripTimestamps, publicCache } from './helpers';

const router = Router();

// ── Public team members ──
router.get('/api/team', publicCache(300), async (_req: Request, res: Response) => {
    try {
        const members = await db.select().from(schema.teamMembers)
            .where(and(eq(schema.teamMembers.is_active, true), eq(schema.teamMembers.is_archived, false)))
            .orderBy(schema.teamMembers.display_order);
        res.json(members);
    } catch {
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// Public: get single team member by id
router.get('/api/team/:id', publicCache(300), async (req: Request, res: Response) => {
    try {
        const [member] = await db.select().from(schema.teamMembers)
            .where(eq(schema.teamMembers.id, parseInt(req.params.id)));
        if (!member) { res.status(404).json({ error: 'Not found' }); return; }
        res.json(member);
    } catch {
        res.status(500).json({ error: 'Failed to fetch team member' });
    }
});

// Admin: list all team members
router.get('/api/admin/team', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.teamMembers).orderBy(schema.teamMembers.display_order);
        res.json(all);
    } catch {
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
});

router.post('/api/admin/team', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [created] = await db.insert(schema.teamMembers).values({
            ...stripTimestamps(req.body),
            created_at: new Date(),
            updated_at: new Date(),
        } as any).returning();
        await logAudit(req, 'create', 'team_member', String(created.id), null, created);
        res.status(201).json(created);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create team member';
        logger.error('Failed to create team member', { error: message });
        res.status(500).json({ success: false, error: message });
    }
});

router.put('/api/admin/team/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
        const [existing] = await db.select().from(schema.teamMembers).where(eq(schema.teamMembers.id, id)).limit(1);
        const [updated] = await db.update(schema.teamMembers)
            .set({ ...stripTimestamps(req.body), updated_at: new Date() })
            .where(eq(schema.teamMembers.id, id))
            .returning();
        if (!updated) { res.status(404).json({ error: 'Team member not found' }); return; }
        await logAudit(req, 'update', 'team_member', String(id), existing, updated);
        res.json(updated);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update team member';
        logger.error('Failed to update team member', { error: message });
        res.status(500).json({ success: false, error: message });
    }
});

router.delete('/api/admin/team/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const [existing] = await db.select().from(schema.teamMembers).where(eq(schema.teamMembers.id, id)).limit(1);
        if (!existing) { res.status(404).json({ error: 'Team member not found' }); return; }
        await db.delete(schema.teamMembers).where(eq(schema.teamMembers.id, id));
        await logAudit(req, 'delete', 'team_member', String(id), existing, null);
        res.json({ message: 'Team member deleted' });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete team member';
        logger.error('Failed to delete team member', { error: message });
        res.status(500).json({ success: false, error: message });
    }
});

// Bulk archive team members by edition
router.post('/api/admin/team/bulk-archive', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { edition_id } = req.body;
        if (!edition_id) { res.status(400).json({ error: 'edition_id required' }); return; }
        await db.update(schema.teamMembers)
            .set({ is_archived: true, is_active: false, updated_at: new Date() })
            .where(eq(schema.teamMembers.edition_id, edition_id));
        await logAudit(req, 'bulk_archive', 'team_member', null, null, { edition_id });
        res.json({ message: 'All team members archived for edition' });
    } catch {
        res.status(500).json({ error: 'Failed to bulk archive' });
    }
});

// ── Past Events ──
router.get('/api/past-events', publicCache(300), async (_req: Request, res: Response) => {
    try {
        const events = await db.select().from(schema.pastEvents)
            .where(eq(schema.pastEvents.is_active, true))
            .orderBy(schema.pastEvents.display_order);
        res.json(events);
    } catch {
        res.status(500).json({ error: 'Failed to fetch past events' });
    }
});

router.get('/api/past-events/:id', publicCache(300), async (req: Request, res: Response) => {
    try {
        const [event] = await db.select().from(schema.pastEvents)
            .where(eq(schema.pastEvents.id, parseInt(req.params.id)));
        if (!event) { res.status(404).json({ error: 'Not found' }); return; }
        res.json(event);
    } catch {
        res.status(500).json({ error: 'Failed to fetch past event' });
    }
});

router.get('/api/admin/past-events', verifyAdmin, async (_req: AuthRequest, res: Response) => {
    try {
        const events = await db.select().from(schema.pastEvents).orderBy(schema.pastEvents.display_order);
        res.json(events);
    } catch {
        res.status(500).json({ error: 'Failed to fetch past events' });
    }
});

router.post('/api/admin/past-events', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [created] = await db.insert(schema.pastEvents).values({
            ...stripTimestamps(req.body),
            created_at: new Date(),
            updated_at: new Date(),
        } as any).returning();
        res.status(201).json(created);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create past event';
        res.status(500).json({ error: message });
    }
});

router.put('/api/admin/past-events/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [updated] = await db.update(schema.pastEvents)
            .set({ ...stripTimestamps(req.body), updated_at: new Date() })
            .where(eq(schema.pastEvents.id, parseInt(req.params.id)))
            .returning();
        res.json(updated);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update past event';
        res.status(500).json({ error: message });
    }
});

router.delete('/api/admin/past-events/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await db.delete(schema.pastEvents).where(eq(schema.pastEvents.id, parseInt(req.params.id)));
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to delete past event' });
    }
});

export default router;
