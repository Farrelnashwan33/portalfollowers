import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'portal-followers-super-secret-jwt-key-2026';
const JWT_EXPIRES_IN = '7d';

export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: (decoded.role || 'CUSTOMER').toUpperCase() as UserRole,
    };
  } catch (error) {
    return null;
  }
}

export function getAuthUser(req: NextRequest): TokenPayload | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

export function requireAdmin(req: NextRequest): { user: TokenPayload | null; response?: NextResponse } {
  const user = getAuthUser(req);
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi autentikasi tidak valid atau telah berakhir.' },
        { status: 401 }
      ),
    };
  }

  if (user.role !== 'ADMIN') {
    return {
      user: null,
      response: NextResponse.json(
        { success: false, error: 'Forbidden: Hanya akun Administrator yang memiliki akses ke fitur ini.' },
        { status: 403 }
      ),
    };
  }

  return { user };
}

export async function logAdminActivity(
  admin: TokenPayload,
  action: string,
  targetId?: string | null,
  details?: string | null,
  ipAddress?: string | null
) {
  try {
    const logId = crypto.randomUUID();
    await execute(
      `INSERT INTO admin_logs (id, admin_id, admin_email, action, target_id, details, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [logId, admin.userId, admin.email, action, targetId || null, details || null, ipAddress || null]
    );
  } catch (e) {
    console.error('Failed to write admin log:', e);
  }
}
