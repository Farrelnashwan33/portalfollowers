import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { hashPassword, getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().optional(),
  password: z.string().min(6, { message: 'Password baru minimal 6 karakter.' }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = resetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Password tidak valid (minimal 6 karakter).' },
        { status: 400 }
      );
    }

    const { token, password } = validationResult.data;
    const newHash = await hashPassword(password);

    // Case 1: If user is authenticated via Bearer token
    const authUser = getAuthUser(req);
    if (authUser) {
      await execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, authUser.userId]);
      return NextResponse.json({
        success: true,
        message: 'Password berhasil diperbarui.',
      });
    }

    // Case 2: Reset token based
    if (token) {
      const user = await queryOne<any>(
        'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
        [token]
      );

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Tautan reset kata sandi tidak valid atau sudah kadaluarsa.' },
          { status: 400 }
        );
      }

      await execute(
        'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
        [newHash, user.id]
      );

      return NextResponse.json({
        success: true,
        message: 'Password berhasil diperbarui. Silakan login kembali.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Autentikasi atau token reset diperlukan.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in reset-password:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mereset kata sandi.' },
      { status: 500 }
    );
  }
}
