import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { comparePassword, generateToken, UserRole } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email({ message: 'Alamat email tidak valid.' }).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, { message: 'Password wajib diisi.' }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validationResult = loginSchema.safeParse(body);
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

    const { email, password } = validationResult.data;

    // Fetch user with password_hash
    const user = await queryOne<any>('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Email atau kata sandi tidak sesuai.' },
        { status: 401 }
      );
    }

    // Verify password with bcrypt
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Email atau kata sandi tidak sesuai.' },
        { status: 401 }
      );
    }

    // Fetch profile
    let profile = await queryOne<any>('SELECT * FROM profiles WHERE id = ?', [user.id]);
    if (!profile) {
      profile = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    }

    const role: UserRole = (user.role || 'CUSTOMER').toUpperCase() as UserRole;

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role,
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role,
      created_at: user.created_at,
    };

    return NextResponse.json({
      success: true,
      message: `Login berhasil sebagai ${role}.`,
      data: {
        token,
        role,
        user: userResponse,
        profile: {
          ...profile,
          role,
        },
      },
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat masuk.', details: error?.message },
      { status: 500 }
    );
  }
}
