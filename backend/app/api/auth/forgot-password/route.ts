import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Alamat email tidak valid.' }).transform((v) => v.trim().toLowerCase()),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Email tidak valid.' },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    const user = await queryOne('SELECT id FROM users WHERE email = ?', [email]);

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 3600000); // 1 hour

      await execute(
        'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
        [resetToken, expiry, user.id]
      );
    }

    // Always respond with success to prevent user enumeration
    return NextResponse.json({
      success: true,
      message: 'Instruksi pemulihan kata sandi telah dikirim jika email terdaftar.',
    });
  } catch (error: any) {
    console.error('Error in forgot-password:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses permintaan pemulihan kata sandi.' },
      { status: 500 }
    );
  }
}
