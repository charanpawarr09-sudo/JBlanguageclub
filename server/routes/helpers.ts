import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { db } from '../db/index';
import * as schema from '../db/schema';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

/* ─── Audit Log Helper ─── */
export async function logAudit(req: AuthRequest, action: string, entityType: string, entityId?: string | null, oldValue?: any, newValue?: any) {
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
export function stripTimestamps(body: Record<string, any>): Record<string, any> {
    const { created_at, updated_at, id, ...safe } = body;
    return safe;
}

/** Like stripTimestamps but preserves the `id` field (needed for events where id is user-specified) */
export function stripTimestampsKeepId(body: Record<string, any>): Record<string, any> {
    const { created_at, updated_at, ...safe } = body;
    return safe;
}

/* ─── HTML Sanitization (strip tags to prevent XSS) ─── */
export function sanitizeHtml(input: string): string {
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
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

export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
        cb(null, allowed.includes(file.mimetype));
    },
});

export { uploadDir };

/* ─── Magic Byte Validation for Uploads ─── */
const MAGIC_BYTES: Record<string, number[]> = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
};

export function validateMagicBytes(filePath: string, mimetype: string): boolean {
    const expected = MAGIC_BYTES[mimetype];
    if (!expected) return true; // SVG etc — skip binary check
    try {
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(expected.length);
        fs.readSync(fd, buffer, 0, expected.length, 0);
        fs.closeSync(fd);
        return expected.every((byte, i) => buffer[i] === byte);
    } catch {
        return false;
    }
}

/* ─── Validation Schemas ─── */
export const teamMemberSchema = z.object({
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

export const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

export const preRegisterSchema = z.object({
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

export const contactSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    subject: z.string().min(1),
    message: z.string().min(1),
});

/* ─── Public Cache Middleware ─── */
export function publicCache(maxAge: number = 300) {
    return (_req: Request, res: Response, next: Function) => {
        res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
        next();
    };
}
