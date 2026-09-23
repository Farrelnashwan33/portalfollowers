import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Sesi tidak valid.' },
      { status: 401 }
    );
  }

  try {
    const orders = await query(
      `SELECT 
        o.id,
        o.order_code,
        o.user_id,
        o.package_id,
        o.customer_name,
        o.customer_email,
        o.instagram_username,
        o.instagram_url,
        o.followers_amount,
        o.price,
        o.payment_status,
        o.service_status,
        o.payment_method,
        o.xendit_payment_url,
        o.is_admin_order,
        o.customer_note,
        o.created_at,
        o.updated_at,
        p.name AS package_name,
        p.category AS package_category,
        p.badge AS package_badge,
        p.estimated_processing_minutes AS package_estimated_minutes,
        p.estimated_time AS package_estimated_time
       FROM orders o
       LEFT JOIN packages p ON o.package_id = p.id
       WHERE o.user_id = ? OR o.customer_email = ?
       ORDER BY o.created_at DESC`,
      [user.userId, user.email]
    );

    const formatted = orders.map((o: any) => ({
      ...o,
      price: Number(o.price),
      is_admin_order: Boolean(o.is_admin_order),
      packages: o.package_id
        ? {
            id: o.package_id,
            name: o.package_name,
            category: o.package_category,
            badge: o.package_badge,
            estimated_processing_minutes: o.package_estimated_minutes,
            estimated_time: o.package_estimated_time,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
