import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID Pesanan diperlukan.' }, { status: 400 });
    }

    // Check if query is UUID or Order Code
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let orderSql = `
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
        p.id AS package_pk,
        p.name AS package_name,
        p.followers AS package_followers,
        p.price AS package_price,
        p.description AS package_description,
        p.estimated_time AS package_estimated_time,
        p.badge AS package_badge
      FROM orders o
      LEFT JOIN packages p ON o.package_id = p.id
      WHERE ${isUuid ? 'o.id = ?' : 'o.order_code = ?'}
    `;

    const orderRow = await queryOne<any>(orderSql, [isUuid ? id : id.toUpperCase()]);

    if (!orderRow) {
      return NextResponse.json(
        { success: false, error: 'Pesanan tidak ditemukan. Pastikan nomor pesanan benar.' },
        { status: 404 }
      );
    }

    // Fetch order status history
    const historyRows = await query<any>(
      'SELECT id, order_id, status, note, created_at FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC',
      [orderRow.id]
    );

    const fullOrder = {
      id: orderRow.id,
      order_code: orderRow.order_code,
      user_id: orderRow.user_id,
      package_id: orderRow.package_id,
      customer_name: orderRow.customer_name,
      customer_email: orderRow.customer_email,
      instagram_username: orderRow.instagram_username,
      instagram_url: orderRow.instagram_url,
      followers_amount: orderRow.followers_amount,
      price: Number(orderRow.price),
      payment_status: orderRow.payment_status,
      service_status: orderRow.service_status,
      payment_method: orderRow.payment_method,
      customer_note: orderRow.customer_note,
      admin_note: orderRow.admin_note,
      created_at: orderRow.created_at,
      updated_at: orderRow.updated_at,
      packages: orderRow.package_id
        ? {
            id: orderRow.package_pk,
            name: orderRow.package_name,
            followers: orderRow.package_followers,
            price: Number(orderRow.package_price),
            description: orderRow.package_description,
            estimated_time: orderRow.package_estimated_time,
            badge: orderRow.package_badge,
          }
        : null,
      order_status_history: historyRows,
    };

    return NextResponse.json({
      success: true,
      data: fullOrder,
    });
  } catch (error: any) {
    console.error('Unhandled GET /api/orders/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', details: error?.message },
      { status: 500 }
    );
  }
}
