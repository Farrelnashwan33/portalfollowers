import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi tidak valid atau telah berakhir.' },
        { status: 401 }
      );
    }

    const user = await queryOne<any>(
      'SELECT id, email, full_name, role, created_at, updated_at FROM users WHERE id = ?',
      [authUser.userId]
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    const profile = await queryOne<any>(
      'SELECT id, email, full_name, role, created_at, updated_at FROM profiles WHERE id = ?',
      [authUser.userId]
    );

    const role = (user.role || 'CUSTOMER').toUpperCase();

    return NextResponse.json({
      success: true,
      data: {
        role,
        user: {
          ...user,
          role,
        },
        profile: {
          ...(profile || user),
          role,
        },
      },
    });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}
