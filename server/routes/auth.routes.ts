import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { verifyAdmin, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rateLimiter';
import { loginSchema } from './helpers';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

router.post('/api/auth/login', authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
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

router.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.clearCookie('admin_token');
    res.json({ message: 'Logged out' });
});

router.get('/api/auth/me', verifyAdmin, (req: AuthRequest, res: Response) => {
    res.json({ username: req.admin?.username, role: req.admin?.role, authenticated: true });
});

export default router;
