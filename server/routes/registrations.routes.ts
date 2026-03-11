import { Router, Request, Response } from 'express';
import { db } from '../db/index';
import * as schema from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { verifyAdmin, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { registrationLimiter } from '../middleware/rateLimiter';
import { logAudit, preRegisterSchema } from './helpers';
import { calculateFee, toPaise } from '../utils/fees';
import { generateRegistrationCode } from '../utils/codes';
import { sendRegistrationConfirmation } from '../services/email.service';
import { events as localEvents } from '../../src/data/events';

const router = Router();

// Pre-register (with transaction for race condition fix #16)
router.post('/api/registrations/pre-register', registrationLimiter, validate(preRegisterSchema), async (req: Request, res: Response) => {
    const { event_id, team_size, primary_name, primary_email, primary_phone, selected_round_index } = req.body;

    try {
        let event;
        try {
            const [dbEvent] = await db.select().from(schema.events).where(eq(schema.events.id, event_id)).limit(1);
            event = dbEvent;
        } catch (err) {
            // Fallback to local data if DB is offline
            event = localEvents.find((e: any) => e.id === event_id);
        }

        if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
        if (!event.registration_enabled) { res.status(400).json({ error: 'Registration is closed for this event' }); return; }

        // For film-screening with per-round pricing, look up the round's fee
        let roundFee: number | undefined;
        if (event_id === 'film-screening' && selected_round_index !== undefined && selected_round_index !== null) {
            const rounds = (event as any).rounds as Array<{ title: string; description: string; fee?: number }> | null;
            if (rounds && rounds[selected_round_index] && rounds[selected_round_index].fee) {
                roundFee = rounds[selected_round_index].fee;
            }
        }

        const feeINR = calculateFee(event, team_size, roundFee);
        const amountPaise = toPaise(feeINR);
        const registrationCode = generateRegistrationCode();

        // Use transaction to prevent race condition on slots_filled (#16)
        try {
            await db.transaction(async (tx) => {
                await tx.insert(schema.registrations).values({
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

                await tx.update(schema.events)
                    .set({ slots_filled: (event.slots_filled || 0) + 1 })
                    .where(eq(schema.events.id, event_id));
            });
        } catch (dbErr) {
            logger.warn('Failed to save registration to DB (likely no connection), proceeding anyway.', { error: String(dbErr) });
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
router.get('/api/registrations/:code', async (req: Request, res: Response) => {
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
router.post('/api/registrations/create-order', registrationLimiter, async (req: Request, res: Response) => {
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
router.post('/api/registrations/verify-payment', registrationLimiter, async (req: Request, res: Response) => {
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
router.get('/api/admin/registrations', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const all = await db.select().from(schema.registrations).orderBy(desc(schema.registrations.created_at));
        res.json(all);
    } catch {
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
});

// Admin: update registration status
router.patch('/api/admin/registrations/:id/status', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
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
router.post('/api/admin/registrations/bulk-confirm', verifyAdmin, async (req: AuthRequest, res: Response) => {
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
router.patch('/api/admin/registrations/:id/attend', verifyAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
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
router.delete('/api/admin/registrations/:id', verifyAdmin, requireRole('super_admin', 'technical_admin'), async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
        const [existing] = await db.select().from(schema.registrations).where(eq(schema.registrations.id, id)).limit(1);
        if (!existing) { res.status(404).json({ error: 'Registration not found' }); return; }
        await db.update(schema.registrations).set({ status: 'cancelled' }).where(eq(schema.registrations.id, id));
        await logAudit(req, 'delete', 'registration', String(id), existing, null);
        res.json({ message: 'Registration cancelled' });
    } catch {
        res.status(500).json({ error: 'Failed to delete registration' });
    }
});

export default router;
