import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rawOrders = await query(`
      SELECT 
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
        o.customer_note,
        o.admin_note,
        o.created_at,
        o.updated_at,
        p.name AS package_name,
        p.badge AS package_badge,
        p.estimated_time AS package_estimated_time,
        p.description AS package_description
      FROM orders o
      LEFT JOIN packages p ON o.package_id = p.id
      ORDER BY o.created_at DESC
    `);

    // Fetch all history for all orders
    const rawHistories = await query(`
      SELECT id, order_id, status, note, created_at
      FROM order_status_history
      ORDER BY created_at ASC
    `);

    const historyByOrderId: Record<string, any[]> = {};
    for (const h of rawHistories) {
      if (!historyByOrderId[h.order_id]) {
        historyByOrderId[h.order_id] = [];
      }
      historyByOrderId[h.order_id].push(h);
    }

    const formattedOrders = rawOrders.map((ord: any) => ({
      id: ord.id,
      order_code: ord.order_code,
      user_id: ord.user_id,
      package_id: ord.package_id,
      customer_name: ord.customer_name,
      customer_email: ord.customer_email,
      instagram_username: ord.instagram_username,
      instagram_url: ord.instagram_url,
      followers_amount: ord.followers_amount,
      price: Number(ord.price),
      payment_status: ord.payment_status,
      service_status: ord.service_status,
      payment_method: ord.payment_method,
      customer_note: ord.customer_note,
      admin_note: ord.admin_note,
      created_at: ord.created_at,
      updated_at: ord.updated_at,
      packages: ord.package_id
        ? {
            id: ord.package_id,
            name: ord.package_name,
            badge: ord.package_badge,
            estimated_time: ord.package_estimated_time,
            description: ord.package_description,
          }
        : null,
      order_status_history: historyByOrderId[ord.id] || [],
    }));

    return NextResponse.json({
      success: true,
      data: formattedOrders,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/orders:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat seluruh pesanan admin.', details: error?.message },
      { status: 500 }
    );
  }
}
