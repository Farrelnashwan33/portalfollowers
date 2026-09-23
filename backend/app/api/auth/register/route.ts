import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { z } from 'zod';
import crypto from 'crypto';

const registerSchema = z.object({
  fullName: z.string().min(2, { message: 'Nama lengkap minimal 2 karakter.' }),
  email: z.string().email({ message: 'Alamat email tidak valid.' }).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(6, { message: 'Password minimal 6 karakter.' }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validasi gagal',
          details: validationResult.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      );
    }

    const { fullName, email, password } = validationResult.data;
    const role = 'CUSTOMER'; // New registrations are always CUSTOMER role

    // Check if email already registered
    const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email ini sudah terdaftar. Silakan gunakan email lain atau masuk.' },
        { status: 409 }
      );
    }

    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const now = new Date();

    // Insert user & profile
    await execute(
      'INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, email, passwordHash, fullName, role, now, now]
    );

    await execute(
      'INSERT INTO profiles (id, email, full_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, email, fullName, role, now, now]
    );

    const userProfile = {
      id: userId,
      email,
      full_name: fullName,
      role,
      created_at: now.toISOString(),
    };

    const token = generateToken({
      userId,
      email,
      role: 'CUSTOMER',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Pendaftaran akun customer berhasil.',
        data: {
          token,
          user: userProfile,
          profile: userProfile,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat mendaftar.', details: error?.message },
      { status: 500 }
    );
  }
}
