import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;

    const order = await queryOne<any>(
      'SELECT id, order_code, payment_status, service_status, price, xendit_invoice_id, xendit_payment_url FROM orders WHERE id = ? OR order_code = ?',
      [orderId, orderId]
    );

    if (!order) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    const paymentLogs = await query(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC',
      [order.id]
    );

    return NextResponse.json({
      success: true,
      data: {
        order,
        payments: paymentLogs,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
