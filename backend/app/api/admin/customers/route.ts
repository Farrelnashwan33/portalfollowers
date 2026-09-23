import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, response } = requireAdmin(req);
  if (!user || response) return response;

  try {
    const customers = await query(`
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.role,
        u.created_at,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(CASE WHEN o.payment_status = 'PAID' THEN o.price ELSE 0 END), 0) AS total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'CUSTOMER'
      GROUP BY u.id, u.email, u.full_name, u.role, u.created_at
      ORDER BY u.created_at DESC
    `);

    const formatted = customers.map((c: any) => ({
      ...c,
      total_orders: Number(c.total_orders),
      total_spent: Number(c.total_spent),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
