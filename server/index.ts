import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';

import { db } from './db/index';
import * as schema from './db/schema';
import { logger } from './utils/logger';
import { generalLimiter } from './middleware/rateLimiter';
import { verifyAdmin, AuthRequest } from './middleware/auth.middleware';
import { upload, uploadDir, validateMagicBytes } from './routes/helpers';

// Route modules
import authRoutes from './routes/auth.routes';
import eventsRoutes from './routes/events.routes';
import teamRoutes from './routes/team.routes';
import registrationsRoutes from './routes/registrations.routes';
import contentRoutes from './routes/content.routes';
import adminRoutes from './routes/admin.routes';
import contactRoutes from './routes/contact.routes';

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
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/* ─── HTTPS Redirect (Production) ─── */
if (process.env.NODE_ENV === 'production') {
    app.use((req: Request, res: Response, next: NextFunction) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(301, `https://${req.hostname}${req.url}`);
        }
        next();
    });
}

/* ─── Global Middleware ─── */
app.use(helmet({ contentSecurityPolicy: false }));

// Security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

const allowedOrigins = FRONTEND_URL.split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
    origin: (origin, callback) => {
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

/* ─── Health Check ─── */
app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

/* ─── Mount Route Modules ─── */
app.use(authRoutes);
app.use(eventsRoutes);
app.use(teamRoutes);
app.use(registrationsRoutes);
app.use(contentRoutes);
app.use(adminRoutes);
app.use(contactRoutes);

/* ─── Image Upload Endpoint (with magic byte validation #8) ─── */
app.post('/api/admin/upload', verifyAdmin as any, upload.single('image'), (req: AuthRequest, res: Response) => {
    if (!req.file) { res.status(400).json({ error: 'No valid image file provided. Allowed: jpg, png, webp, gif, svg (max 5MB)' }); return; }

    // Validate magic bytes to prevent MIME spoofing (#8)
    if (!validateMagicBytes(req.file.path, req.file.mimetype)) {
        fs.unlinkSync(req.file.path);
        res.status(400).json({ error: 'File content does not match its declared type. Upload rejected.' });
        return;
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, size: req.file.size });
});

/* ─── No auto-seeding: events are managed entirely via admin panel ─── */

/* ─── Static Files (Production) ─── */
const distPath = path.resolve(process.cwd(), 'dist');

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Cache static assets with hashed filenames for 1 year
app.use('/assets', express.static(path.join(distPath, 'assets'), {
    maxAge: '365d',
    immutable: true,
}));

// Cache uploads for 7 days
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads'), {
    maxAge: '7d',
}));

// Other static files (index.html, etc.) — short cache
app.use(express.static(distPath, {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    },
}));

app.get('*', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(distPath, 'index.html'));
});

/* ─── Global Error Handler ─── */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', { message: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
});

/* ─── Start ─── */
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info('Routes mounted: auth, events, team, registrations, content, admin, contact');
});

export default app;
