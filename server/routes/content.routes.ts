import { Router, Request, Response } from 'express';
import { db } from '../db/index';
import * as schema from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAdmin, AuthRequest } from '../middleware/auth.middleware';
import { logAudit, stripTimestamps, publicCache } from './helpers';

const router = Router();

/* ═══ FAQ Routes ═══ */

router.get('/api/faqs', publicCache(300), async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.faq).where(eq(schema.faq.is_active, true)).orderBy(schema.faq.display_order);
        res.json(all);
    } catch { res.status(500).json({ error: 'Failed to fetch FAQs' }); }
});

router.get('/api/admin/faqs', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.faq).orderBy(schema.faq.display_order);
        res.json(all);
    } catch { res.status(500).json({ error: 'Failed to fetch FAQs' }); }
});

router.post('/api/admin/faqs', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [created] = await db.insert(schema.faq).values({ ...stripTimestamps(req.body), created_at: new Date(), updated_at: new Date() }).returning();
        await logAudit(req, 'create', 'faq', String(created.id), null, created);
        res.status(201).json(created);
    } catch { res.status(500).json({ error: 'Failed to create FAQ' }); }
});

router.put('/api/admin/faqs/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const [updated] = await db.update(schema.faq).set({ ...stripTimestamps(req.body), updated_at: new Date() }).where(eq(schema.faq.id, id)).returning();
        if (!updated) { res.status(404).json({ error: 'FAQ not found' }); return; }
        await logAudit(req, 'update', 'faq', String(id));
        res.json(updated);
    } catch { res.status(500).json({ error: 'Failed to update FAQ' }); }
});

router.delete('/api/admin/faqs/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        await db.update(schema.faq).set({ is_active: false, updated_at: new Date() }).where(eq(schema.faq.id, id));
        await logAudit(req, 'delete', 'faq', String(id));
        res.json({ message: 'FAQ deleted' });
    } catch { res.status(500).json({ error: 'Failed to delete FAQ' }); }
});

/* ═══ TESTIMONIALS Routes ═══ */

router.get('/api/testimonials', publicCache(300), async (_req: Request, res: Response) => {
    try {
        const rows = await db.select().from(schema.testimonials)
            .where(eq(schema.testimonials.is_active, true))
            .orderBy(schema.testimonials.display_order);
        res.json(rows);
    } catch { res.status(500).json({ error: 'Failed to fetch testimonials' }); }
});

router.get('/api/admin/testimonials', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.testimonials).orderBy(schema.testimonials.display_order);
        res.json(all);
    } catch { res.status(500).json({ error: 'Failed to fetch testimonials' }); }
});

router.post('/api/admin/testimonials', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [created] = await db.insert(schema.testimonials).values({ ...stripTimestamps(req.body), created_at: new Date(), updated_at: new Date() }).returning();
        await logAudit(req, 'create', 'testimonial', String(created.id), null, created);
        res.status(201).json(created);
    } catch { res.status(500).json({ error: 'Failed to create testimonial' }); }
});

router.put('/api/admin/testimonials/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const [updated] = await db.update(schema.testimonials).set({ ...stripTimestamps(req.body), updated_at: new Date() }).where(eq(schema.testimonials.id, id)).returning();
        if (!updated) { res.status(404).json({ error: 'Testimonial not found' }); return; }
        await logAudit(req, 'update', 'testimonial', String(id));
        res.json(updated);
    } catch { res.status(500).json({ error: 'Failed to update testimonial' }); }
});

router.delete('/api/admin/testimonials/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        await db.update(schema.testimonials).set({ is_active: false, updated_at: new Date() }).where(eq(schema.testimonials.id, id));
        await logAudit(req, 'delete', 'testimonial', String(id));
        res.json({ message: 'Testimonial deleted' });
    } catch { res.status(500).json({ error: 'Failed to delete testimonial' }); }
});

/* ═══ TIMELINE Routes ═══ */

router.get('/api/timeline', publicCache(300), async (_req: Request, res: Response) => {
    try {
        const rows = await db.select().from(schema.timelineEvents)
            .where(eq(schema.timelineEvents.is_active, true))
            .orderBy(schema.timelineEvents.display_order);
        res.json(rows);
    } catch { res.status(500).json({ error: 'Failed to fetch timeline' }); }
});

router.get('/api/admin/timeline', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.timelineEvents).orderBy(schema.timelineEvents.display_order);
        res.json(all);
    } catch { res.status(500).json({ error: 'Failed to fetch timeline' }); }
});

router.post('/api/admin/timeline', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [created] = await db.insert(schema.timelineEvents).values({ ...stripTimestamps(req.body), created_at: new Date(), updated_at: new Date() }).returning();
        await logAudit(req, 'create', 'timeline_event', String(created.id), null, created);
        res.status(201).json(created);
    } catch { res.status(500).json({ error: 'Failed to create timeline event' }); }
});

router.put('/api/admin/timeline/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const [updated] = await db.update(schema.timelineEvents).set({ ...stripTimestamps(req.body), updated_at: new Date() }).where(eq(schema.timelineEvents.id, id)).returning();
        if (!updated) { res.status(404).json({ error: 'Timeline event not found' }); return; }
        await logAudit(req, 'update', 'timeline_event', String(id));
        res.json(updated);
    } catch { res.status(500).json({ error: 'Failed to update timeline event' }); }
});

router.delete('/api/admin/timeline/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        await db.update(schema.timelineEvents).set({ is_active: false, updated_at: new Date() }).where(eq(schema.timelineEvents.id, id));
        await logAudit(req, 'delete', 'timeline_event', String(id));
        res.json({ message: 'Timeline event deleted' });
    } catch { res.status(500).json({ error: 'Failed to delete timeline event' }); }
});

/* ═══ ANNOUNCEMENTS Routes ═══ */

router.get('/api/announcements', publicCache(300), async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.announcements).where(eq(schema.announcements.is_active, true));
        res.json(all);
    } catch { res.status(500).json({ error: 'Failed to fetch announcements' }); }
});

router.get('/api/admin/announcements', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.announcements).orderBy(desc(schema.announcements.created_at));
        res.json(all);
    } catch { res.status(500).json({ error: 'Failed to fetch announcements' }); }
});

router.post('/api/admin/announcements', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [created] = await db.insert(schema.announcements).values({ ...stripTimestamps(req.body), created_at: new Date(), updated_at: new Date() }).returning();
        await logAudit(req, 'create', 'announcement', String(created.id), null, created);
        res.status(201).json(created);
    } catch { res.status(500).json({ error: 'Failed to create announcement' }); }
});

router.put('/api/admin/announcements/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const [updated] = await db.update(schema.announcements).set({ ...stripTimestamps(req.body), updated_at: new Date() }).where(eq(schema.announcements.id, id)).returning();
        if (!updated) { res.status(404).json({ error: 'Announcement not found' }); return; }
        await logAudit(req, 'update', 'announcement', String(id));
        res.json(updated);
    } catch { res.status(500).json({ error: 'Failed to update announcement' }); }
});

router.delete('/api/admin/announcements/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        await db.update(schema.announcements).set({ is_active: false, updated_at: new Date() }).where(eq(schema.announcements.id, id));
        await logAudit(req, 'delete', 'announcement', String(id));
        res.json({ message: 'Announcement deleted' });
    } catch { res.status(500).json({ error: 'Failed to delete announcement' }); }
});

/* ═══ CONTENT CMS Routes ═══ */

router.get('/api/admin/content', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.content);
        res.json(all);
    } catch { res.status(500).json({ error: 'Failed to fetch content' }); }
});

router.put('/api/admin/content', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const items = req.body as Array<{ key: string; value: string; content_type?: string; edition_id?: number }>;
        for (const item of items) {
            const [existing] = await db.select().from(schema.content).where(eq(schema.content.key, item.key)).limit(1);
            if (existing) {
                await db.update(schema.content).set({ value: item.value, updated_at: new Date() }).where(eq(schema.content.id, existing.id));
            } else {
                await db.insert(schema.content).values({
                    key: item.key,
                    value: item.value,
                    content_type: item.content_type || 'text',
                    edition_id: item.edition_id || null,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            }
        }
        await logAudit(req, 'update', 'content', null, null, { count: items.length });
        res.json({ message: 'Content updated' });
    } catch { res.status(500).json({ error: 'Failed to update content' }); }
});

/* ═══ SITE SETTINGS Routes ═══ */

router.get('/api/settings', publicCache(300), async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.siteSettings);
        const settings: Record<string, string | null> = {};
        all.forEach((s) => { settings[s.key] = s.value; });
        res.json(settings);
    } catch {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.put('/api/admin/settings', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const entries = Object.entries(req.body as Record<string, string>);
        for (const [key, value] of entries) {
            await db.insert(schema.siteSettings).values({ key, value })
                .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value, updated_at: new Date() } });
        }
        await logAudit(req, 'update', 'settings', null, null, { keys: entries.map(e => e[0]) });
        res.json({ success: true, message: 'Settings updated' });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update settings';
        res.status(500).json({ success: false, error: message });
    }
});

export default router;
