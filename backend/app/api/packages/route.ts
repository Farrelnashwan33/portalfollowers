import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    let sql = `
      SELECT 
        id, name, category, followers, price, description,
        estimated_processing_minutes, estimated_time, badge, is_active,
        created_at, updated_at
      FROM packages
      WHERE is_active = 1
    `;
    const params: any[] = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category.toUpperCase());
    } else {
      // By default for public, exclude admin-only promotion free packages
      sql += " AND category != 'PROMOTION_FREE'";
    }

    sql += ' ORDER BY category ASC, followers ASC';

    const packages = await query(sql, params);

    const formatted = packages.map((p: any) => ({
      ...p,
      price: Number(p.price),
      is_active: Boolean(p.is_active),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Error in GET /api/packages:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat paket followers.', details: error?.message },
      { status: 500 }
    );
  }
}
