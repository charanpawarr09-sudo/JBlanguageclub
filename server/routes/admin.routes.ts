import { Router, Request, Response } from 'express';
import express from 'express';
import { db } from '../db/index';
import * as schema from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { verifyAdmin, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { logAudit, stripTimestamps } from './helpers';

const router = Router();

/* ═══ ADMIN USERS MANAGEMENT ═══ */

router.get('/api/admin/users', verifyAdmin, requireRole('super_admin', 'technical_admin'), async (_req: Request, res: Response) => {
    try {
        const users = await db.select({
            id: schema.adminUsers.id,
            username: schema.adminUsers.username,
            email: schema.adminUsers.email,
            role: schema.adminUsers.role,
            is_active: schema.adminUsers.is_active,
            last_login_at: schema.adminUsers.last_login_at,
            created_at: schema.adminUsers.created_at,
        }).from(schema.adminUsers);
        res.json(users);
    } catch { res.status(500).json({ error: 'Failed to fetch admin users' }); }
});

router.post('/api/admin/users', verifyAdmin, requireRole('super_admin', 'technical_admin'), async (req: AuthRequest, res: Response) => {
    try {
        const { username, email, password, role } = req.body;
        const password_hash = await bcrypt.hash(password, 12);
        const [created] = await db.insert(schema.adminUsers).values({
            username, email, password_hash, role: role || 'event_manager',
        }).returning();
        await logAudit(req, 'create', 'admin_user', String(created.id), null, { username, role });
        res.status(201).json({ id: created.id, username: created.username, email: created.email, role: created.role });
    } catch (err) {
        logger.error('Failed to create admin user', { error: String(err) });
        res.status(500).json({ error: 'Failed to create admin user' });
    }
});

router.put('/api/admin/users/:id', verifyAdmin, requireRole('super_admin', 'technical_admin'), async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const updates: any = {};
        if (req.body.role) updates.role = req.body.role;
        if (req.body.email) updates.email = req.body.email;
        if (req.body.is_active !== undefined) updates.is_active = req.body.is_active;
        if (req.body.password) updates.password_hash = await bcrypt.hash(req.body.password, 12);

        const [updated] = await db.update(schema.adminUsers).set(updates).where(eq(schema.adminUsers.id, id)).returning();
        if (!updated) { res.status(404).json({ error: 'User not found' }); return; }
        await logAudit(req, 'update', 'admin_user', String(id));
        res.json({ id: updated.id, username: updated.username, email: updated.email, role: updated.role, is_active: updated.is_active });
    } catch { res.status(500).json({ error: 'Failed to update admin user' }); }
});

/* ═══ ANALYTICS ═══ */

router.get('/api/admin/analytics', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const allRegistrations = await db.select().from(schema.registrations);
        const allEvents = await db.select().from(schema.events);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalRegistrations = allRegistrations.length;
        const todayRegistrations = allRegistrations.filter(r => r.created_at && new Date(r.created_at) >= today).length;
        const confirmedCount = allRegistrations.filter(r => r.status === 'confirmed').length;
        const pendingCount = allRegistrations.filter(r => r.status === 'pending').length;
        const cancelledCount = allRegistrations.filter(r => r.status === 'cancelled').length;
        const totalRevenue = allRegistrations.filter(r => r.status === 'confirmed').reduce((sum, r) => sum + (r.fee_amount || 0), 0);
        const publishedEvents = allEvents.filter(e => e.is_published && !e.is_archived).length;

        // Registrations per event
        const regByEvent: Record<string, { event_title: string; count: number; slots_total: number | null }> = {};
        for (const event of allEvents) {
            regByEvent[event.id] = {
                event_title: event.title,
                count: allRegistrations.filter(r => r.event_id === event.id).length,
                slots_total: event.slots_total,
            };
        }

        // Registrations over last 30 days
        const last30Days: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            last30Days[key] = 0;
        }
        for (const reg of allRegistrations) {
            if (reg.created_at) {
                const key = new Date(reg.created_at).toISOString().split('T')[0];
                if (last30Days[key] !== undefined) last30Days[key]++;
            }
        }

        // Top colleges
        const collegeCounts: Record<string, number> = {};
        for (const reg of allRegistrations) {
            const college = reg.college_name || 'Unknown';
            collegeCounts[college] = (collegeCounts[college] || 0) + 1;
        }
        const topCollege = Object.entries(collegeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        // Solo vs Team
        const soloCount = allRegistrations.filter(r => r.team_size === 1).length;
        const teamCount = allRegistrations.filter(r => r.team_size > 1).length;

        res.json({
            totalRegistrations,
            todayRegistrations,
            confirmedCount,
            pendingCount,
            cancelledCount,
            totalRevenue,
            publishedEvents,
            totalEvents: allEvents.length,
            registrationsByEvent: regByEvent,
            registrationsOverTime: last30Days,
            topCollege,
            participationSplit: { solo: soloCount, team: teamCount },
        });
    } catch (err) {
        logger.error('Analytics error', { error: String(err) });
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

/* ═══ AUDIT LOG ═══ */

router.get('/api/admin/audit-log', verifyAdmin, requireRole('super_admin', 'technical_admin'), async (_req: Request, res: Response) => {
    try {
        const logs = await db.select().from(schema.auditLog).orderBy(desc(schema.auditLog.created_at)).limit(500);
        res.json(logs);
    } catch { res.status(500).json({ error: 'Failed to fetch audit logs' }); }
});

/* ═══ EMAIL BLAST ═══ */

router.post('/api/admin/email-blast', verifyAdmin, requireRole('super_admin', 'technical_admin'), async (req: AuthRequest, res: Response) => {
    try {
        const { subject, html_body, event_id, status_filter } = req.body;
        if (!subject || !html_body) {
            res.status(400).json({ error: 'Subject and body are required' });
            return;
        }

        let registrations = await db.select().from(schema.registrations);
        if (event_id) {
            registrations = registrations.filter(r => r.event_id === event_id);
        }
        if (status_filter) {
            registrations = registrations.filter(r => r.status === status_filter);
        }

        const emails = [...new Set(registrations.map(r => r.primary_email).filter(Boolean))];
        if (emails.length === 0) {
            res.status(400).json({ error: 'No recipients found matching the criteria' });
            return;
        }

        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        if (!RESEND_API_KEY || RESEND_API_KEY === 'your-resend-api-key') {
            res.status(503).json({ error: 'Email service not configured. Set RESEND_API_KEY.' });
            return;
        }

        const { Resend } = await import('resend');
        const resend = new Resend(RESEND_API_KEY);
        const FROM_EMAIL = process.env.FROM_EMAIL || 'VOXERA <noreply@jblanguageclub.in>';

        let sentCount = 0;
        let failCount = 0;

        for (let i = 0; i < emails.length; i += 10) {
            const batch = emails.slice(i, i + 10);
            const promises = batch.map(async (email) => {
                try {
                    await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html: html_body });
                    sentCount++;
                } catch {
                    failCount++;
                }
            });
            await Promise.all(promises);
            if (i + 10 < emails.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        await logAudit(req, 'email_blast', 'registrations', null, null, {
            subject, total_recipients: emails.length, sent: sentCount, failed: failCount, event_id: event_id || 'all',
        });

        logger.info('Email blast completed', { sent: sentCount, failed: failCount, total: emails.length });
        res.json({
            message: `Email blast sent to ${sentCount} recipients`,
            sent: sentCount, failed: failCount, total: emails.length,
        });
    } catch (err) {
        logger.error('Email blast failed', { error: String(err) });
        res.status(500).json({ error: 'Email blast failed' });
    }
});

/* ═══ FESTIVALS & EDITIONS ═══ */

router.get('/api/admin/festivals', verifyAdmin, async (_req: Request, res: Response) => {
    try { const all = await db.select().from(schema.festivals); res.json(all); }
    catch { res.status(500).json({ error: 'Failed to fetch festivals' }); }
});

router.post('/api/admin/festivals', verifyAdmin, requireRole('super_admin', 'technical_admin'), async (req: AuthRequest, res: Response) => {
    try {
        const [created] = await db.insert(schema.festivals).values({ ...req.body, created_at: new Date(), updated_at: new Date() }).returning();
        await logAudit(req, 'create', 'festival', String(created.id));
        res.status(201).json(created);
    } catch { res.status(500).json({ error: 'Failed to create festival' }); }
});

router.get('/api/admin/editions', verifyAdmin, async (_req: Request, res: Response) => {
    try { const all = await db.select().from(schema.editions).orderBy(desc(schema.editions.year)); res.json(all); }
    catch { res.status(500).json({ error: 'Failed to fetch editions' }); }
});

router.post('/api/admin/editions', verifyAdmin, requireRole('super_admin', 'technical_admin'), async (req: AuthRequest, res: Response) => {
    try {
        const [created] = await db.insert(schema.editions).values({ ...req.body, created_at: new Date(), updated_at: new Date() }).returning();
        await logAudit(req, 'create', 'edition', String(created.id));
        res.status(201).json(created);
    } catch { res.status(500).json({ error: 'Failed to create edition' }); }
});

export default router;
