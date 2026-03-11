import { Router, Request, Response } from 'express';
import express from 'express';
import { db } from '../db/index';
import * as schema from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAdmin, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { contactLimiter } from '../middleware/rateLimiter';
import { logAudit, contactSchema, sanitizeHtml } from './helpers';
import { sendContactNotification } from '../services/email.service';

const router = Router();

/* ═══ CONTACT ═══ */

router.post('/api/contact', contactLimiter, validate(contactSchema), async (req: Request, res: Response) => {
    try {
        // Sanitize inputs to prevent XSS (#7)
        const sanitized = {
            name: sanitizeHtml(req.body.name),
            email: req.body.email, // email is already validated by Zod
            subject: sanitizeHtml(req.body.subject),
            message: sanitizeHtml(req.body.message),
        };
        await db.insert(schema.contactSubmissions).values(sanitized);
        sendContactNotification(sanitized).catch(() => { });
        res.json({ message: 'Message sent successfully' });
    } catch {
        res.status(500).json({ error: 'Failed to process contact submission' });
    }
});

// Admin: list contact submissions
router.get('/api/admin/contacts', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const all = await db.select().from(schema.contactSubmissions).orderBy(desc(schema.contactSubmissions.created_at));
        res.json(all);
    } catch {
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// Admin: update contact status
router.patch('/api/admin/contacts/:id', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { status, is_read } = req.body;
        const [updated] = await db.update(schema.contactSubmissions)
            .set({ status, is_read })
            .where(eq(schema.contactSubmissions.id, id))
            .returning();
        if (!updated) { res.status(404).json({ error: 'Contact not found' }); return; }
        res.json(updated);
    } catch {
        res.status(500).json({ error: 'Failed to update contact' });
    }
});

/* ═══ WEBHOOKS ═══ */

router.post('/api/webhooks/google-forms', express.json(), async (req: Request, res: Response) => {
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

export default router;
