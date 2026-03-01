import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export interface AuthRequest extends Request {
    admin?: { username: string; role: string };
}

export function verifyAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
    try {
        // Try httpOnly cookie first
        let token = req.cookies?.admin_token;

        // Fallback to Authorization header (for non-browser clients)
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.slice(7);
            }
        }

        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { username: string; role: string };
        req.admin = { username: decoded.username, role: decoded.role || 'super_admin' };
        next();
    } catch (err) {
        logger.warn('Auth middleware: invalid token');
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }
}

/**
 * Middleware factory for role-based access control.
 * Usage: requireRole('super_admin', 'technical_admin')
 */
export function requireRole(...allowedRoles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.admin) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!allowedRoles.includes(req.admin.role)) {
            logger.warn('Permission denied', {
                username: req.admin.username,
                role: req.admin.role,
                required: allowedRoles,
                path: req.path,
            });
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }

        next();
    };
}
