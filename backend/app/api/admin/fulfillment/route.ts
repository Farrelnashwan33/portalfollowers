import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { user, response } = requireAdmin(req);
  if (!user || response) return response;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    let sql = `
      SELECT 
        f.*,
        o.order_code,
        o.instagram_username as target_username,
        o.price as order_amount,
        o.customer_name,
        o.customer_email,
        pkg.name as package_name,
        pkg.category as package_category,
        pkg.provider_service_id
      FROM fulfillment_tasks f
      LEFT JOIN orders o ON f.order_id = o.id
      LEFT JOIN packages pkg ON o.package_id = pkg.id
    `;
    const params: any[] = [];

    if (status) {
      sql += ` WHERE f.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY f.created_at DESC LIMIT 100`;

    const tasks = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: tasks
    });
  } catch (error: any) {
    console.error('Fetch fulfillment tasks error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data fulfillment' }, { status: 500 });
  }
}
