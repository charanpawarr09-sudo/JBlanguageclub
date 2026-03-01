import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import multer from 'multer';
import { eq, desc, sql, and, ilike, or } from 'drizzle-orm';

import { db } from './db/index';
import * as schema from './db/schema';
import { calculateFee, toPaise } from './utils/fees';
import { generateRegistrationCode } from './utils/codes';
import { logger } from './utils/logger';
import { verifyAdmin, requireRole, AuthRequest } from './middleware/auth.middleware';
import { validate } from './middleware/validate.middleware';
import { authLimiter, generalLimiter, registrationLimiter, contactLimiter } from './middleware/rateLimiter';
import { sendRegistrationConfirmation, sendContactNotification } from './services/email.service';

// Event seed data
import { events as seedEvents } from '../src/data/events';

// ─── Startup Env Validation ───
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'ADMIN_PASSWORD_HASH', 'ADMIN_USERNAME'] as const;

if (!process.env.DATABASE_URL) {
    console.warn('⚠️  WARNING: DATABASE_URL not set. Database features will be unavailable.');
}
for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
        console.error(`❌ FATAL: Missing required environment variable: ${envVar}`);
        console.error('   Please ensure all required env vars are set. Exiting...');
        process.exit(1);
    }
}

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/* ─── Global Middleware ─── */
app.use(helmet({
    contentSecurityPolicy: false,
}));
const allowedOrigins = FRONTEND_URL.split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(generalLimiter);

/* ─── Audit Log Helper ─── */
async function logAudit(req: AuthRequest, action: string, entityType: string, entityId?: string, oldValue?: any, newValue?: any) {
    try {
        await db.insert(schema.auditLog).values({
            admin_user_id: null,
            admin_username: req.admin?.username || 'system',
            action,
            entity_type: entityType,
            entity_id: entityId || null,
            old_value: oldValue || null,
            new_value: newValue || null,
            ip_address: req.ip || req.socket.remoteAddress || null,
        });
    } catch (err) {
        logger.warn('Audit log write failed', { error: String(err) });
    }
}

/* ─── Strip timestamps/id from req.body to prevent Drizzle toISOString errors ─── */
function stripTimestamps(body: Record<string, any>): Record<string, any> {
    const { created_at, updated_at, id, ...safe } = body;
    return safe;
}

/** Like stripTimestamps but preserves the `id` field (needed for events where id is user-specified) */
function stripTimestampsKeepId(body: Record<string, any>): Record<string, any> {
    const { created_at, updated_at, ...safe } = body;
    return safe;
}

/* ─── Multer Setup for Image Upload ─── */
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir, { recursive: true }); }

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        cb(null, name);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
        cb(null, allowed.includes(file.mimetype));
    },
});

/* ─── Validation Schemas ─── */
const teamMemberSchema = z.object({
    name: z.string().min(1, 'Name is required').max(256),
    role: z.string().max(128).optional(),
    designation: z.string().max(256).optional(),
    dept_group: z.string().max(64).optional(),
    display_order: z.number().int().optional(),
    photo_url: z.string().url().or(z.literal('')).optional(),
    linkedin_url: z.string().url().or(z.literal('')).optional(),
    instagram_url: z.string().url().or(z.literal('')).optional(),
    email: z.string().email().or(z.literal('')).optional(),
    phone: z.string().max(20).optional(),
    bio: z.string().optional(),
    join_date: z.string().max(64).optional(),
    contributions: z.string().optional(),
    skills: z.string().optional(),
    year_branch: z.string().max(128).optional(),
    motto: z.string().max(256).optional(),
    is_active: z.boolean().optional(),
}).passthrough();

/* ═══════════════════════════════════════════
   AUTH Routes
   ═══════════════════════════════════════════ */

const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

app.post('/api/auth/login', authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
        let userRole = 'super_admin';

        // Check env-based admin first
        const adminHash = process.env.ADMIN_PASSWORD_HASH;
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';

        if (username === adminUsername && adminHash) {
            const match = await bcrypt.compare(password, adminHash);
            if (!match) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }
            userRole = 'super_admin';
        } else {
            // Check DB admin users
            try {
                const [user] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.username, username)).limit(1);
                if (!user || !(await bcrypt.compare(password, user.password_hash))) {
                    res.status(401).json({ error: 'Invalid credentials' });
                    return;
                }
                if (!user.is_active) {
                    res.status(403).json({ error: 'Account is deactivated' });
                    return;
                }
                userRole = user.role;

                // Update last_login_at
                await db.update(schema.adminUsers).set({ last_login_at: new Date() } as any).where(eq(schema.adminUsers.id, user.id));
            } catch {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }
        }

        const token = jwt.sign({ username, role: userRole }, JWT_SECRET, { expiresIn: '24h' });

        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.json({ token, role: userRole, username, message: 'Login successful' });
    } catch (err) {
        logger.error('Login error', { error: String(err) });
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.clearCookie('admin_token');
    res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', verifyAdmin, (req: AuthRequest, res: Response) => {
    res.json({ username: req.admin?.username, role: req.admin?.role, authenticated: true });
});

/* ═══════════════════════════════════════════
   EVENTS Routes
   ═══════════════════════════════════════════ */

// Public: list published events
app.get('/api/events', async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.events);
        // Strip google_form_url from public response — it's only accessible after payment
        res.json(all.map(({ google_form_url, ...event }) => event));
    } catch {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Public: get event by id
app.get('/api/events/:id', async (req: Request, res: Response) => {
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
app.post('/api/admin/events', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const eventData = {
            ...stripTimestampsKeepId(req.body),
            id: req.body.id || req.body.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            created_at: new Date(),
            updated_at: new Date(),
        };
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
app.put('/api/admin/events/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [existing] = await db.select().from(schema.events).where(eq(schema.events.id, req.params.id)).limit(1);
        if (!existing) { res.status(404).json({ success: false, error: 'Event not found' }); return; }
        const [updated] = await db.update(schema.events).set({ ...stripTimestampsKeepId(req.body), updated_at: new Date() }).where(eq(schema.events.id, req.params.id)).returning();
        await logAudit(req, 'update', 'event', updated.id, existing, updated);
        res.json({ success: true, data: updated });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update event';
        logger.error('Failed to update event', { error: message });
        res.status(500).json({ success: false, error: message });
    }
});

// Admin: Toggle publish/disable
app.patch('/api/admin/events/:id/toggle', verifyAdmin, async (req: AuthRequest, res: Response) => {
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

// Admin: Delete event (soft-delete via archive)
app.delete('/api/admin/events/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [event] = await db.select().from(schema.events).where(eq(schema.events.id, req.params.id)).limit(1);
        if (!event) { res.status(404).json({ success: false, error: 'Event not found' }); return; }
        const [archived] = await db.update(schema.events).set({ is_archived: true, is_published: false, updated_at: new Date() }).where(eq(schema.events.id, req.params.id)).returning();
        await logAudit(req, 'archive', 'event', req.params.id, event, archived);
        res.json({ success: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete event';
        logger.error('Failed to delete event', { error: message });
        res.status(500).json({ success: false, error: message });
    }
});

/* ═══════════════════════════════════════════
   TEAM MANAGEMENT Routes
   ═══════════════════════════════════════════ */

app.get('/api/admin/team', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.teamMembers).orderBy(schema.teamMembers.display_order);
        res.json(all);
    } catch {
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
});

// Public: get active team members
app.get('/api/team', async (_req: Request, res: Response) => {
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
app.get('/api/team/:id', async (req: Request, res: Response) => {
    try {
        const [member] = await db.select().from(schema.teamMembers)
            .where(eq(schema.teamMembers.id, parseInt(req.params.id)));
        if (!member) return res.status(404).json({ error: 'Not found' });
        res.json(member);
    } catch {
        res.status(500).json({ error: 'Failed to fetch team member' });
    }
});

// ── Past Events ──
app.get('/api/past-events', async (_req: Request, res: Response) => {
    try {
        const events = await db.select().from(schema.pastEvents)
            .where(eq(schema.pastEvents.is_active, true))
            .orderBy(schema.pastEvents.display_order);
        res.json(events);
    } catch {
        res.status(500).json({ error: 'Failed to fetch past events' });
    }
});

app.get('/api/past-events/:id', async (req: Request, res: Response) => {
    try {
        const [event] = await db.select().from(schema.pastEvents)
            .where(eq(schema.pastEvents.id, parseInt(req.params.id)));
        if (!event) return res.status(404).json({ error: 'Not found' });
        res.json(event);
    } catch {
        res.status(500).json({ error: 'Failed to fetch past event' });
    }
});

app.get('/api/admin/past-events', verifyAdmin, async (_req: AuthRequest, res: Response) => {
    try {
        const events = await db.select().from(schema.pastEvents).orderBy(schema.pastEvents.display_order);
        res.json(events);
    } catch {
        res.status(500).json({ error: 'Failed to fetch past events' });
    }
});

app.post('/api/admin/past-events', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [created] = await db.insert(schema.pastEvents).values({
            ...stripTimestamps(req.body),
            created_at: new Date(),
            updated_at: new Date(),
        }).returning();
        res.status(201).json(created);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create past event';
        res.status(500).json({ error: message });
    }
});

app.put('/api/admin/past-events/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
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

app.delete('/api/admin/past-events/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await db.delete(schema.pastEvents).where(eq(schema.pastEvents.id, parseInt(req.params.id)));
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to delete past event' });
    }
});

app.post('/api/admin/team', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [created] = await db.insert(schema.teamMembers).values({
            ...stripTimestamps(req.body),
            created_at: new Date(),
            updated_at: new Date(),
        }).returning();
        await logAudit(req, 'create', 'team_member', String(created.id), null, created);
        res.status(201).json(created);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create team member';
        logger.error('Failed to create team member', { error: message });
        res.status(500).json({ success: false, error: message });
    }
});

app.put('/api/admin/team/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
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

app.delete('/api/admin/team/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const [existing] = await db.select().from(schema.teamMembers).where(eq(schema.teamMembers.id, id)).limit(1);
        if (!existing) { res.status(404).json({ error: 'Team member not found' }); return; }
        const [archived] = await db.update(schema.teamMembers)
            .set({ is_archived: true, is_active: false, updated_at: new Date() })
            .where(eq(schema.teamMembers.id, id))
            .returning();
        await logAudit(req, 'archive', 'team_member', String(id), existing, archived);
        res.json({ message: 'Team member archived', member: archived });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to archive team member';
        logger.error('Failed to archive team member', { error: message });
        res.status(500).json({ success: false, error: message });
    }
});

// Bulk archive team members by edition
app.post('/api/admin/team/bulk-archive', verifyAdmin, async (req: AuthRequest, res: Response) => {
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

/* ═══════════════════════════════════════════
   SITE SETTINGS Routes
   ═══════════════════════════════════════════ */

// Public: get all site settings as key-value object
app.get('/api/settings', async (_req: Request, res: Response) => {
    try {
        const rows = await db.select().from(schema.siteSettings);
        const obj: Record<string, string> = {};
        rows.forEach(r => { if (r.key && r.value) obj[r.key] = r.value; });
        res.json(obj);
    } catch {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Admin: save site settings (bulk upsert)
app.put('/api/admin/settings', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const entries = Object.entries(req.body as Record<string, string>);
        for (const [key, value] of entries) {
            const [existing] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, key)).limit(1);
            if (existing) {
                await db.update(schema.siteSettings).set({ value: String(value), updated_at: new Date() }).where(eq(schema.siteSettings.key, key));
            } else {
                await db.insert(schema.siteSettings).values({ key, value: String(value), updated_at: new Date() });
            }
        }
        await logAudit(req, 'update', 'site_settings', null, null, req.body);
        res.json({ message: 'Settings saved' });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});

/* ═══════════════════════════════════════════
   FAQ Routes
   ═══════════════════════════════════════════ */

// Public: get active FAQs
app.get('/api/faqs', async (_req: Request, res: Response) => {
    try {
        const rows = await db.select().from(schema.faq)
            .where(eq(schema.faq.is_active, true))
            .orderBy(schema.faq.display_order);
        res.json(rows);
    } catch {
        res.status(500).json({ error: 'Failed to fetch FAQs' });
    }
});

/* ═══════════════════════════════════════════
   ANNOUNCEMENTS Routes
   ═══════════════════════════════════════════ */

// Public: get active announcements
app.get('/api/announcements', async (_req: Request, res: Response) => {
    try {
        const rows = await db.select().from(schema.announcements)
            .where(eq(schema.announcements.is_active, true));
        res.json(rows);
    } catch {
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
});

/* ═══════════════════════════════════════════
   CONTACT Routes
   ═══════════════════════════════════════════ */

// Public: save contact form submission
app.post('/api/contact', contactLimiter, async (req: Request, res: Response) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            res.status(400).json({ error: 'All fields required' }); return;
        }
        await db.insert(schema.contactSubmissions).values({
            name, email, subject, message, status: 'new', is_read: false, created_at: new Date(),
        });
        res.json({ message: 'Message sent successfully' });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});

/* ═══════════════════════════════════════════
   REGISTRATION Routes
   ═══════════════════════════════════════════ */

const preRegisterSchema = z.object({
    event_id: z.string().min(1),
    team_size: z.number().int().min(1).max(10),
    participation_type: z.enum(['solo', 'team']),
    primary_name: z.string().min(1, 'Name is required'),
    primary_email: z.string().email('Valid email required'),
    primary_phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile number required'),
    college_name: z.string().min(1, 'College name is required'),
    department: z.string().min(1, 'Department is required'),
    year_of_study: z.string().min(1, 'Year of study is required'),
    roll_number: z.string().min(1, 'Roll number is required'),
    team_members: z.array(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        roll_number: z.string().min(1),
    })).optional().default([]),
});

// Pre-register
app.post('/api/registrations/pre-register', registrationLimiter, validate(preRegisterSchema), async (req: Request, res: Response) => {
    const { event_id, team_size, primary_name, primary_email, primary_phone } = req.body;

    try {
        const [event] = await db.select().from(schema.events).where(eq(schema.events.id, event_id)).limit(1);
        if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
        if (!event.registration_enabled) { res.status(400).json({ error: 'Registration is closed for this event' }); return; }

        const feeINR = calculateFee(event_id, team_size);
        const amountPaise = toPaise(feeINR);
        const registrationCode = generateRegistrationCode();

        await db.insert(schema.registrations).values({
            registration_code: registrationCode,
            event_id,
            primary_name,
            primary_email,
            primary_phone,
            college_name: req.body.college_name || null,
            department: req.body.department || null,
            year_of_study: req.body.year_of_study || null,
            roll_number: req.body.roll_number || null,
            team_size,
            team_members: req.body.team_members || [],
            fee_amount: amountPaise,
            payment_status: 'pending',
            status: 'pending_payment',
        });

        if (event) {
            await db.update(schema.events)
                .set({ slots_filled: (event.slots_filled || 0) + 1 })
                .where(eq(schema.events.id, event_id));
        }

        sendRegistrationConfirmation({
            to: primary_email,
            name: primary_name,
            registrationCode,
            eventTitle: event.title,
            eventDate: event.date,
            eventLocation: event.location || '',
            teamSize: team_size,
            feeAmount: amountPaise,
        }).catch(() => { });

        logger.info('Pre-registration saved', { registrationCode, event_id });

        res.status(201).json({
            registration_code: registrationCode,
            event_title: event.title,
            fee_amount: amountPaise,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Pre-registration failed';
        logger.error('Pre-registration failed', { error: message, event_id });
        res.status(500).json({ error: message });
    }
});

// Get registration by code
app.get('/api/registrations/:code', async (req: Request, res: Response) => {
    try {
        const [reg] = await db.select().from(schema.registrations).where(eq(schema.registrations.registration_code, req.params.code)).limit(1);
        if (!reg) { res.status(404).json({ error: 'Registration not found' }); return; }
        const [event] = await db.select().from(schema.events).where(eq(schema.events.id, reg.event_id)).limit(1);
        // Only show Google Form URL if payment has been submitted
        const showGoogleForm = reg.payment_status === 'payment_submitted' || reg.status === 'confirmed';
        res.json({
            registration_code: reg.registration_code,
            event_title: event?.title || reg.event_id,
            event_date: event?.date || '',
            event_time: event?.time || '',
            event_location: event?.location || '',
            primary_name: reg.primary_name,
            primary_email: reg.primary_email,
            team_members: reg.team_members,
            team_size: reg.team_size,
            fee_amount: reg.fee_amount,
            status: reg.status,
            payment_status: reg.payment_status,
            payment_id: reg.payment_id || null,
            google_form_url: showGoogleForm ? (event?.google_form_url || null) : null,
        });
    } catch {
        res.status(500).json({ error: 'Failed to fetch registration' });
    }
});

// ─── Razorpay: Create Order ───
app.post('/api/registrations/create-order', registrationLimiter, async (req: Request, res: Response) => {
    try {
        const { registration_code } = req.body;
        if (!registration_code) { res.status(400).json({ error: 'Registration code is required' }); return; }

        const [reg] = await db.select().from(schema.registrations)
            .where(eq(schema.registrations.registration_code, registration_code)).limit(1);
        if (!reg) { res.status(404).json({ error: 'Registration not found' }); return; }
        if (reg.status === 'confirmed') { res.json({ already_paid: true, message: 'Already confirmed' }); return; }

        const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
        const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
        if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
            res.status(503).json({ error: 'Payment gateway not configured' }); return;
        }

        const Razorpay = (await import('razorpay')).default;
        const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

        const order = await razorpay.orders.create({
            amount: reg.fee_amount, // already in paise
            currency: 'INR',
            receipt: registration_code,
            notes: { registration_code, event_id: reg.event_id, name: reg.primary_name },
        });

        // Store order in razorpay_orders table
        await db.insert(schema.razorpayOrders).values({
            order_id: order.id,
            event_id: reg.event_id,
            amount: reg.fee_amount,
            currency: 'INR',
            status: 'created',
            receipt: registration_code,
            payload: order as any,
        });

        // Link order to registration
        await db.update(schema.registrations)
            .set({ order_id: order.id })
            .where(eq(schema.registrations.registration_code, registration_code));

        logger.info('Razorpay order created', { order_id: order.id, registration_code });

        res.json({
            order_id: order.id,
            amount: reg.fee_amount,
            currency: 'INR',
            key_id: RAZORPAY_KEY_ID,
            name: reg.primary_name,
            email: reg.primary_email,
            phone: reg.primary_phone || '',
        });
    } catch (err) {
        logger.error('Create order failed', { error: String(err) });
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});

// ─── Razorpay: Verify Payment ───
app.post('/api/registrations/verify-payment', registrationLimiter, async (req: Request, res: Response) => {
    try {
        const { registration_code, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!registration_code || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            res.status(400).json({ error: 'Missing payment verification data' }); return;
        }

        const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
        if (!RAZORPAY_KEY_SECRET) { res.status(503).json({ error: 'Payment gateway not configured' }); return; }

        // Verify signature using HMAC-SHA256
        const crypto = await import('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            logger.warn('Invalid payment signature', { registration_code, razorpay_order_id });
            res.status(400).json({ error: 'Payment verification failed — invalid signature' }); return;
        }

        // Signature valid — confirm registration
        const [reg] = await db.select().from(schema.registrations)
            .where(eq(schema.registrations.registration_code, registration_code)).limit(1);
        if (!reg) { res.status(404).json({ error: 'Registration not found' }); return; }

        await db.update(schema.registrations)
            .set({
                payment_id: razorpay_payment_id,
                payment_status: 'paid',
                status: 'confirmed',
            })
            .where(eq(schema.registrations.registration_code, registration_code));

        // Update razorpay_orders
        await db.update(schema.razorpayOrders)
            .set({ status: 'paid' })
            .where(eq(schema.razorpayOrders.order_id, razorpay_order_id));

        // Fetch event for Google Form URL
        const [event] = await db.select().from(schema.events)
            .where(eq(schema.events.id, reg.event_id)).limit(1);

        // Send confirmation email
        sendRegistrationConfirmation({
            to: reg.primary_email,
            name: reg.primary_name,
            registrationCode: registration_code,
            eventTitle: event?.title || reg.event_id,
            eventDate: event?.date || '',
            eventLocation: event?.location || '',
            teamSize: reg.team_size,
            feeAmount: reg.fee_amount,
        }).catch(() => { });

        logger.info('Payment verified & registration confirmed', {
            registration_code, razorpay_payment_id, razorpay_order_id,
        });

        res.json({
            success: true,
            message: 'Payment verified — Registration confirmed!',
            status: 'confirmed',
            google_form_url: event?.google_form_url || null,
            registration_code,
        });
    } catch (err) {
        logger.error('Payment verification failed', { error: String(err) });
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

// Admin: list all registrations
app.get('/api/admin/registrations', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const all = await db.select().from(schema.registrations).orderBy(desc(schema.registrations.created_at));
        res.json(all);
    } catch {
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
});

// Admin: update registration status
app.patch('/api/admin/registrations/:id/status', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;
        if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
            res.status(400).json({ error: 'Invalid status. Use: pending, confirmed, cancelled' });
            return;
        }
        const [existing] = await db.select().from(schema.registrations).where(eq(schema.registrations.id, id)).limit(1);
        if (!existing) { res.status(404).json({ error: 'Registration not found' }); return; }
        const [updated] = await db.update(schema.registrations)
            .set({ status, payment_status: status === 'confirmed' ? 'paid' : existing.payment_status })
            .where(eq(schema.registrations.id, id))
            .returning();
        await logAudit(req, 'update_status', 'registration', String(id), { status: existing.status }, { status });
        res.json(updated);
    } catch {
        res.status(500).json({ error: 'Failed to update registration status' });
    }
});

// Admin: bulk confirm registrations
app.post('/api/admin/registrations/bulk-confirm', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) { res.status(400).json({ error: 'ids array required' }); return; }
        for (const id of ids) {
            await db.update(schema.registrations)
                .set({ status: 'confirmed', payment_status: 'paid' })
                .where(eq(schema.registrations.id, id));
        }
        await logAudit(req, 'bulk_confirm', 'registration', null, null, { ids });
        res.json({ message: `${ids.length} registrations confirmed` });
    } catch {
        res.status(500).json({ error: 'Failed to bulk confirm' });
    }
});

// Admin: mark attendance
app.patch('/api/admin/registrations/:id/attend', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const [updated] = await db.update(schema.registrations)
            .set({ attended_at: new Date() })
            .where(eq(schema.registrations.id, id))
            .returning();
        if (!updated) { res.status(404).json({ error: 'Registration not found' }); return; }
        await logAudit(req, 'mark_attendance', 'registration', String(id));
        res.json(updated);
    } catch {
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
});

// Admin: delete registration
app.delete('/api/admin/registrations/:id', verifyAdmin, requireRole('super_admin', 'technical_admin'), async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const [existing] = await db.select().from(schema.registrations).where(eq(schema.registrations.id, id)).limit(1);
        if (!existing) { res.status(404).json({ error: 'Registration not found' }); return; }
        await db.update(schema.registrations).set({ status: 'cancelled' }).where(eq(schema.registrations.id, id));
        await logAudit(req, 'delete', 'registration', String(id), existing, null);
        res.json({ message: 'Registration cancelled' });
    } catch {
        res.status(500).json({ error: 'Failed to delete registration' });
    }
});

/* ═══════════════════════════════════════════
   FAQ Routes
   ═══════════════════════════════════════════ */

app.get('/api/faqs', async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.faq).where(eq(schema.faq.is_active, true)).orderBy(schema.faq.display_order);
        res.json(all);
    } catch { res.status(500).json({ error: 'Failed to fetch FAQs' }); }
});

app.get('/api/admin/faqs', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.faq).orderBy(schema.faq.display_order);
        res.json(all);
    } catch { res.status(500).json({ error: 'Failed to fetch FAQs' }); }
});

app.post('/api/admin/faqs', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [created] = await db.insert(schema.faq).values({ ...stripTimestamps(req.body), created_at: new Date(), updated_at: new Date() }).returning();
        await logAudit(req, 'create', 'faq', String(created.id), null, created);
        res.status(201).json(created);
    } catch { res.status(500).json({ error: 'Failed to create FAQ' }); }
});

app.put('/api/admin/faqs/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const [updated] = await db.update(schema.faq).set({ ...stripTimestamps(req.body), updated_at: new Date() }).where(eq(schema.faq.id, id)).returning();
        if (!updated) { res.status(404).json({ error: 'FAQ not found' }); return; }
        await logAudit(req, 'update', 'faq', String(id));
        res.json(updated);
    } catch { res.status(500).json({ error: 'Failed to update FAQ' }); }
});

app.delete('/api/admin/faqs/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        await db.update(schema.faq).set({ is_active: false, updated_at: new Date() }).where(eq(schema.faq.id, id));
        await logAudit(req, 'delete', 'faq', String(id));
        res.json({ message: 'FAQ deleted' });
    } catch { res.status(500).json({ error: 'Failed to delete FAQ' }); }
});

/* ═══════════════════════════════════════════
   TESTIMONIALS Routes
   ═══════════════════════════════════════════ */

// Public: get active testimonials
app.get('/api/testimonials', async (_req: Request, res: Response) => {
    try {
        const rows = await db.select().from(schema.testimonials)
            .where(eq(schema.testimonials.is_active, true))
            .orderBy(schema.testimonials.display_order);
        res.json(rows);
    } catch { res.status(500).json({ error: 'Failed to fetch testimonials' }); }
});

// Admin: list all testimonials
app.get('/api/admin/testimonials', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.testimonials).orderBy(schema.testimonials.display_order);
        res.json(all);
    } catch { res.status(500).json({ error: 'Failed to fetch testimonials' }); }
});

app.post('/api/admin/testimonials', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [created] = await db.insert(schema.testimonials).values({ ...stripTimestamps(req.body), created_at: new Date(), updated_at: new Date() }).returning();
        await logAudit(req, 'create', 'testimonial', String(created.id), null, created);
        res.status(201).json(created);
    } catch { res.status(500).json({ error: 'Failed to create testimonial' }); }
});

app.put('/api/admin/testimonials/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const [updated] = await db.update(schema.testimonials).set({ ...stripTimestamps(req.body), updated_at: new Date() }).where(eq(schema.testimonials.id, id)).returning();
        if (!updated) { res.status(404).json({ error: 'Testimonial not found' }); return; }
        await logAudit(req, 'update', 'testimonial', String(id));
        res.json(updated);
    } catch { res.status(500).json({ error: 'Failed to update testimonial' }); }
});

app.delete('/api/admin/testimonials/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        await db.update(schema.testimonials).set({ is_active: false, updated_at: new Date() }).where(eq(schema.testimonials.id, id));
        await logAudit(req, 'delete', 'testimonial', String(id));
        res.json({ message: 'Testimonial deleted' });
    } catch { res.status(500).json({ error: 'Failed to delete testimonial' }); }
});

/* ═══════════════════════════════════════════
   TIMELINE EVENTS Routes
   ═══════════════════════════════════════════ */

// Public: get active timeline events
app.get('/api/timeline', async (_req: Request, res: Response) => {
    try {
        const rows = await db.select().from(schema.timelineEvents)
            .where(eq(schema.timelineEvents.is_active, true))
            .orderBy(schema.timelineEvents.display_order);
        res.json(rows);
    } catch { res.status(500).json({ error: 'Failed to fetch timeline' }); }
});

// Admin: list all timeline events
app.get('/api/admin/timeline', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.timelineEvents).orderBy(schema.timelineEvents.display_order);
        res.json(all);
    } catch { res.status(500).json({ error: 'Failed to fetch timeline' }); }
});

app.post('/api/admin/timeline', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [created] = await db.insert(schema.timelineEvents).values({ ...stripTimestamps(req.body), created_at: new Date(), updated_at: new Date() }).returning();
        await logAudit(req, 'create', 'timeline_event', String(created.id), null, created);
        res.status(201).json(created);
    } catch { res.status(500).json({ error: 'Failed to create timeline event' }); }
});

app.put('/api/admin/timeline/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const [updated] = await db.update(schema.timelineEvents).set({ ...stripTimestamps(req.body), updated_at: new Date() }).where(eq(schema.timelineEvents.id, id)).returning();
        if (!updated) { res.status(404).json({ error: 'Timeline event not found' }); return; }
        await logAudit(req, 'update', 'timeline_event', String(id));
        res.json(updated);
    } catch { res.status(500).json({ error: 'Failed to update timeline event' }); }
});

app.delete('/api/admin/timeline/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        await db.update(schema.timelineEvents).set({ is_active: false, updated_at: new Date() }).where(eq(schema.timelineEvents.id, id));
        await logAudit(req, 'delete', 'timeline_event', String(id));
        res.json({ message: 'Timeline event deleted' });
    } catch { res.status(500).json({ error: 'Failed to delete timeline event' }); }
});

/* ═══════════════════════════════════════════
   ANNOUNCEMENTS Routes
   ═══════════════════════════════════════════ */

app.get('/api/announcements', async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.announcements).where(eq(schema.announcements.is_active, true));
        res.json(all);
    } catch { res.status(500).json({ error: 'Failed to fetch announcements' }); }
});

app.get('/api/admin/announcements', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.announcements).orderBy(desc(schema.announcements.created_at));
        res.json(all);
    } catch { res.status(500).json({ error: 'Failed to fetch announcements' }); }
});

app.post('/api/admin/announcements', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [created] = await db.insert(schema.announcements).values({ ...stripTimestamps(req.body), created_at: new Date(), updated_at: new Date() }).returning();
        await logAudit(req, 'create', 'announcement', String(created.id), null, created);
        res.status(201).json(created);
    } catch { res.status(500).json({ error: 'Failed to create announcement' }); }
});

app.put('/api/admin/announcements/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const [updated] = await db.update(schema.announcements).set({ ...stripTimestamps(req.body), updated_at: new Date() }).where(eq(schema.announcements.id, id)).returning();
        if (!updated) { res.status(404).json({ error: 'Announcement not found' }); return; }
        await logAudit(req, 'update', 'announcement', String(id));
        res.json(updated);
    } catch { res.status(500).json({ error: 'Failed to update announcement' }); }
});

app.delete('/api/admin/announcements/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        await db.update(schema.announcements).set({ is_active: false, updated_at: new Date() }).where(eq(schema.announcements.id, id));
        await logAudit(req, 'delete', 'announcement', String(id));
        res.json({ message: 'Announcement deleted' });
    } catch { res.status(500).json({ error: 'Failed to delete announcement' }); }
});

/* ═══════════════════════════════════════════
   CONTENT CMS Routes
   ═══════════════════════════════════════════ */

app.get('/api/admin/content', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.content);
        res.json(all);
    } catch { res.status(500).json({ error: 'Failed to fetch content' }); }
});

app.put('/api/admin/content', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const items = req.body as Array<{ key: string; value: string; content_type?: string; edition_id?: number }>;
        for (const item of items) {
            // Upsert: try to update, if not exists, insert
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

/* ═══════════════════════════════════════════
   WEBHOOKS
   ═══════════════════════════════════════════ */

app.post('/api/webhooks/google-forms', express.json(), async (req: Request, res: Response) => {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const providedSecret = req.headers['x-webhook-secret'] as string;

    if (webhookSecret && providedSecret !== webhookSecret) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
    }

    try {
        await db.insert(schema.googleFormSubmissions).values({
            event_id: req.body.event_id || null,
            form_response_id: req.body.form_response_id || null,
            payload: req.body,
        });
        res.json({ status: 'received' });
    } catch {
        res.status(500).json({ error: 'Failed to store submission' });
    }
});

/* ═══════════════════════════════════════════
   CONTACT
   ═══════════════════════════════════════════ */

const contactSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    subject: z.string().min(1),
    message: z.string().min(1),
});

app.post('/api/contact', validate(contactSchema), async (req: Request, res: Response) => {
    try {
        await db.insert(schema.contactSubmissions).values(req.body);
        sendContactNotification(req.body).catch(() => { });
        res.json({ message: 'Message sent successfully' });
    } catch {
        res.status(500).json({ error: 'Failed to process contact submission' });
    }
});

// Admin: list contact submissions
app.get('/api/admin/contacts', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.contactSubmissions).orderBy(desc(schema.contactSubmissions.created_at));
        res.json(all);
    } catch {
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// Admin: update contact status
app.patch('/api/admin/contacts/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const [updated] = await db.update(schema.contactSubmissions)
            .set({ ...req.body })
            .where(eq(schema.contactSubmissions.id, id))
            .returning();
        if (!updated) { res.status(404).json({ error: 'Contact not found' }); return; }
        res.json(updated);
    } catch {
        res.status(500).json({ error: 'Failed to update contact' });
    }
});

/* ═══════════════════════════════════════════
   SITE SETTINGS
   ═══════════════════════════════════════════ */

app.get('/api/settings', async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.siteSettings);
        const settings: Record<string, string | null> = {};
        all.forEach((s) => { settings[s.key] = s.value; });
        res.json(settings);
    } catch {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.put('/api/admin/settings', verifyAdmin, async (req: AuthRequest, res: Response) => {
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
        logger.error('Failed to update settings', { error: message });
        res.status(500).json({ success: false, error: message });
    }
});

/* ═══════════════════════════════════════════
   ADMIN USERS MANAGEMENT
   ═══════════════════════════════════════════ */

app.get('/api/admin/users', verifyAdmin, requireRole('super_admin', 'technical_admin'), async (_req: Request, res: Response) => {
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

app.post('/api/admin/users', verifyAdmin, requireRole('super_admin', 'technical_admin'), async (req: AuthRequest, res: Response) => {
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

app.put('/api/admin/users/:id', verifyAdmin, requireRole('super_admin', 'technical_admin'), async (req: AuthRequest, res: Response) => {
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

/* ═══════════════════════════════════════════
   ANALYTICS
   ═══════════════════════════════════════════ */

app.get('/api/admin/analytics', verifyAdmin, async (_req: Request, res: Response) => {
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

/* ═══════════════════════════════════════════
   AUDIT LOG
   ═══════════════════════════════════════════ */

app.get('/api/admin/audit-log', verifyAdmin, requireRole('super_admin', 'technical_admin'), async (_req: Request, res: Response) => {
    try {
        const logs = await db.select().from(schema.auditLog).orderBy(desc(schema.auditLog.created_at)).limit(500);
        res.json(logs);
    } catch { res.status(500).json({ error: 'Failed to fetch audit logs' }); }
});

/* ═══════════════════════════════════════════
   EMAIL BLAST TO REGISTRANTS
   ═══════════════════════════════════════════ */

app.post('/api/admin/email-blast', verifyAdmin, requireRole('super_admin', 'technical_admin'), async (req: AuthRequest, res: Response) => {
    try {
        const { subject, html_body, event_id, status_filter } = req.body;
        if (!subject || !html_body) {
            res.status(400).json({ error: 'Subject and body are required' });
            return;
        }

        // Build query to get recipient emails
        let registrations = await db.select().from(schema.registrations);
        if (event_id) {
            registrations = registrations.filter(r => r.event_id === event_id);
        }
        if (status_filter) {
            registrations = registrations.filter(r => r.status === status_filter);
        }

        // Deduplicate emails
        const emails = [...new Set(registrations.map(r => r.primary_email).filter(Boolean))];
        if (emails.length === 0) {
            res.status(400).json({ error: 'No recipients found matching the criteria' });
            return;
        }

        // Import Resend from the email service
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        if (!RESEND_API_KEY || RESEND_API_KEY === 'your-resend-api-key') {
            res.status(503).json({ error: 'Email service not configured. Set RESEND_API_KEY.' });
            return;
        }

        const { Resend } = await import('resend');
        const resend = new Resend(RESEND_API_KEY);
        const FROM_EMAIL = process.env.FROM_EMAIL || 'VOXERA <noreply@voxera2026.in>';

        let sentCount = 0;
        let failCount = 0;

        // Send in batches of 10 to avoid rate limits
        for (let i = 0; i < emails.length; i += 10) {
            const batch = emails.slice(i, i + 10);
            const promises = batch.map(async (email) => {
                try {
                    await resend.emails.send({
                        from: FROM_EMAIL,
                        to: email,
                        subject,
                        html: html_body,
                    });
                    sentCount++;
                } catch {
                    failCount++;
                }
            });
            await Promise.all(promises);
            // Small delay between batches
            if (i + 10 < emails.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        await logAudit(req, 'email_blast', 'registrations', null, null, {
            subject,
            total_recipients: emails.length,
            sent: sentCount,
            failed: failCount,
            event_id: event_id || 'all',
        });

        logger.info('Email blast completed', { sent: sentCount, failed: failCount, total: emails.length });
        res.json({
            message: `Email blast sent to ${sentCount} recipients`,
            sent: sentCount,
            failed: failCount,
            total: emails.length,
        });
    } catch (err) {
        logger.error('Email blast failed', { error: String(err) });
        res.status(500).json({ error: 'Email blast failed' });
    }
});

/* ═══════════════════════════════════════════
   FESTIVALS & EDITIONS
   ═══════════════════════════════════════════ */

app.get('/api/admin/festivals', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.festivals);
        res.json(all);
    } catch { res.status(500).json({ error: 'Failed to fetch festivals' }); }
});

app.post('/api/admin/festivals', verifyAdmin, requireRole('super_admin', 'technical_admin'), async (req: AuthRequest, res: Response) => {
    try {
        const [created] = await db.insert(schema.festivals).values({ ...req.body, created_at: new Date(), updated_at: new Date() }).returning();
        await logAudit(req, 'create', 'festival', String(created.id));
        res.status(201).json(created);
    } catch { res.status(500).json({ error: 'Failed to create festival' }); }
});

app.get('/api/admin/editions', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.editions).orderBy(desc(schema.editions.year));
        res.json(all);
    } catch { res.status(500).json({ error: 'Failed to fetch editions' }); }
});

app.post('/api/admin/editions', verifyAdmin, requireRole('super_admin', 'technical_admin'), async (req: AuthRequest, res: Response) => {
    try {
        const [created] = await db.insert(schema.editions).values({ ...req.body, created_at: new Date(), updated_at: new Date() }).returning();
        await logAudit(req, 'create', 'edition', String(created.id));
        res.status(201).json(created);
    } catch { res.status(500).json({ error: 'Failed to create edition' }); }
});

/* ═══════════════════════════════════════════
   DB SEEDING
   ═══════════════════════════════════════════ */

async function seedDatabase() {
    try {
        const existingEvents = await db.select().from(schema.events);

        if (existingEvents.length === 0) {
            logger.info('Seeding database with events...');
            for (const event of seedEvents) {
                await db.insert(schema.events).values({
                    id: event.id,
                    title: event.title,
                    description: event.description,
                    short_description: event.shortDescription,
                    date: event.date,
                    time: event.time,
                    location: event.location,
                    category: event.category,
                    image: event.image,
                    banner_image: event.banner_image,
                    thumbnail_image: event.thumbnail_image,
                    rules: event.rules,
                    team_size: event.teamSize,
                    prize: event.prize,
                    rounds: event.rounds || null,
                    registration_fee_single: event.registration_fee_single,
                    registration_fee_team: event.registration_fee_team,
                    team_size_min: event.team_size_min,
                    team_size_max: event.team_size_max,
                    registration_enabled: event.registration_enabled,
                    is_published: event.is_published,
                    google_form_url: event.google_form_url,
                    slots_total: event.slots_total,
                    slots_filled: event.slots_filled,
                    judging_criteria: event.judging_criteria,
                    coordinators: event.coordinators,
                }).onConflictDoNothing();
            }
            logger.info(`Seeded ${seedEvents.length} events`);
        } else {
            logger.info(`Database already has ${existingEvents.length} events, skipping seed`);
        }
    } catch (err) {
        logger.warn('DB seeding failed (tables may not exist yet)', { error: String(err) });
    }
}

/* ═══════════════════════════════════════════
   STATIC FILES (Production)
   ═══════════════════════════════════════════ */

const distPath = path.resolve(process.cwd(), 'dist');

/* ─── Serve uploaded files ─── */
app.use('/uploads', express.static(uploadDir));

/* ─── Image Upload Endpoint ─── */
app.post('/api/admin/upload', verifyAdmin, upload.single('image'), (req: AuthRequest, res: Response) => {
    if (!req.file) { res.status(400).json({ error: 'No valid image file provided. Allowed: jpg, png, webp, gif, svg (max 5MB)' }); return; }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, size: req.file.size });
});

app.use(express.static(distPath));
app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

/* ═══════════════════════════════════════════
   GLOBAL ERROR HANDLER
   ═══════════════════════════════════════════ */

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', { message: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
});

/* ═══════════════════════════════════════════
   START
   ═══════════════════════════════════════════ */

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    seedDatabase();
});

export default app;
