import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.com';
  const [user, domain] = email.split('@');
  const maskedUser = user.length <= 2 ? user[0] + '*' : user[0] + '*'.repeat(user.length - 2) + user[user.length - 1];
  return `${maskedUser}@${domain}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderCode: string }> }) {
  try {
    const { orderCode } = await params;

    if (!orderCode) {
      return NextResponse.json({ success: false, error: 'Nomor pesanan wajib diisi.' }, { status: 400 });
    }

    const orderSql = `
      SELECT 
        o.id,
        o.order_code,
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
        o.xendit_invoice_id,
        o.xendit_payment_url,
        o.is_admin_order,
        o.created_at,
        o.updated_at,
        p.id AS package_pk,
        p.name AS package_name,
        p.category AS package_category,
        p.followers AS package_followers,
        p.price AS package_price,
        p.description AS package_description,
        p.estimated_processing_minutes AS package_estimated_minutes,
        p.estimated_time AS package_estimated_time,
        p.badge AS package_badge
      FROM orders o
      LEFT JOIN packages p ON o.package_id = p.id
      WHERE o.order_code = ? OR o.id = ?
    `;

    const orderRow = await queryOne<any>(orderSql, [orderCode.toUpperCase().trim(), orderCode.trim()]);

    if (!orderRow) {
      return NextResponse.json(
        { success: false, error: 'Pesanan tidak ditemukan. Pastikan format ID Pesanan benar (contoh: PF-20260923-XXXXXX).' },
        { status: 404 }
      );
    }

    // Fetch order status history
    const historyRows = await query<any>(
      'SELECT id, order_id, status, note, created_at FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC',
      [orderRow.id]
    );

    const publicOrder = {
      id: orderRow.id,
      order_code: orderRow.order_code,
      customer_name: orderRow.customer_name ? orderRow.customer_name[0] + '***' : 'Customer',
      customer_email: maskEmail(orderRow.customer_email),
      instagram_username: orderRow.instagram_username,
      instagram_url: orderRow.instagram_url,
      followers_amount: orderRow.followers_amount,
      price: Number(orderRow.price),
      payment_status: orderRow.payment_status,
      service_status: orderRow.service_status,
      payment_method: orderRow.payment_method,
      xendit_payment_url: orderRow.xendit_payment_url,
      is_admin_order: Boolean(orderRow.is_admin_order),
      created_at: orderRow.created_at,
      updated_at: orderRow.updated_at,
      packages: orderRow.package_id
        ? {
            id: orderRow.package_pk,
            name: orderRow.package_name,
            category: orderRow.package_category,
            followers: orderRow.package_followers,
            price: Number(orderRow.package_price),
            description: orderRow.package_description,
            estimated_processing_minutes: orderRow.package_estimated_minutes,
            estimated_time: orderRow.package_estimated_time,
            badge: orderRow.package_badge,
          }
        : null,
      order_status_history: historyRows,
    };

    return NextResponse.json({
      success: true,
      data: publicOrder,
    });
  } catch (error: any) {
    console.error('Error tracking order:', error);
    return NextResponse.json({ success: false, error: 'Gagal mencari pesanan.' }, { status: 500 });
  }
}
