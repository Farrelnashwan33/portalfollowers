import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { packageSchema } from '@/lib/validations';
import { requireAdmin, logAdminActivity } from '@/lib/auth';
import crypto from 'crypto';

// GET all packages (including inactive and promotion free) for admin
export async function GET(req: NextRequest) {
  const { user, response } = requireAdmin(req);
  if (!user || response) return response;

  try {
    const packages = await query('SELECT * FROM packages ORDER BY category ASC, followers ASC');
    const formatted = packages.map((p: any) => ({
      ...p,
      price: Number(p.price),
      is_active: Boolean(p.is_active),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error in GET /api/admin/packages:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create a new package (admin only)
export async function POST(req: NextRequest) {
  const { user, response } = requireAdmin(req);
  if (!user || response) return response;

  try {
    const body = await req.json();

    const validationResult = packageSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      );
    }

    const {
      name,
      category,
      followers,
      price,
      description,
      estimatedProcessingMinutes,
      estimatedTime,
      badge,
      providerServiceId,
      isActive,
    } = validationResult.data;

    const newId = crypto.randomUUID();
    const now = new Date();

    await execute(
      `INSERT INTO packages (
        id, name, category, followers, price, description,
        estimated_processing_minutes, estimated_time, badge, provider_service_id, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        name,
        category,
        followers,
        price,
        description || null,
        estimatedProcessingMinutes || 5,
        estimatedTime || '1–5 Menit',
        badge || null,
        providerServiceId || null,
        isActive !== undefined ? (isActive ? 1 : 0) : 1,
        now,
        now,
      ]
    );

    const newPackage = await queryOne<any>('SELECT * FROM packages WHERE id = ?', [newId]);

    // Log admin action
    await logAdminActivity(
      user,
      'CREATE_PACKAGE',
      newId,
      `Membuat paket baru: ${name} (${category}, ${followers} followers, Rp${price})`
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Paket berhasil ditambahkan.',
        data: {
          ...newPackage,
          price: Number(newPackage.price),
          is_active: Boolean(newPackage.is_active),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/admin/packages:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
