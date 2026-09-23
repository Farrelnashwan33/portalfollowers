import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute, transaction } from '@/lib/db';
import { xenditService } from '@/services/xendit.service';
import crypto from 'crypto';

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;

    const order = await queryOne<any>(
      'SELECT id, order_code, price, payment_status, service_status, xendit_invoice_id FROM orders WHERE id = ? OR order_code = ?',
      [orderId, orderId]
    );

    if (!order) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    if (!order.xendit_invoice_id) {
      return NextResponse.json({
        success: true,
        data: {
          status: order.payment_status,
          service_status: order.service_status,
        },
      });
    }

    // Check with Xendit API
    const xenditRes = await xenditService.getInvoice(order.xendit_invoice_id);

    if (xenditRes.success && xenditRes.data) {
      const xenditStatus = xenditRes.data.status;

      if ((xenditStatus === 'PAID' || xenditStatus === 'SETTLED') && order.payment_status !== 'PAID') {
        const now = new Date();
        await transaction(async (conn) => {
          await conn.execute(
            'UPDATE orders SET payment_status = ?, service_status = ?, updated_at = ? WHERE id = ?',
            ['PAID', 'WAITING_FOR_FULFILLMENT', now, order.id]
          );

          // History
          const historyId = crypto.randomUUID();
          await conn.execute(
            'INSERT INTO order_status_history (id, order_id, status, note, created_at) VALUES (?, ?, ?, ?, ?)',
            [historyId, order.id, 'PAID', 'Pembayaran terverifikasi lunas dari Xendit.', now]
          );

          // Fulfillment task
          const taskId = crypto.randomUUID();
          await conn.execute(
            `INSERT INTO fulfillment_tasks (id, order_id, provider, service_type, requested_quantity, status, created_at, updated_at)
             VALUES (?, ?, 'INTERNAL', 'INSTAGRAM_FOLLOWERS', ?, 'WAITING_FOR_FULFILLMENT', ?, ?)`,
            [taskId, order.id, order.followers_amount || 100, now, now]
          );
        });

        order.payment_status = 'PAID';
        order.service_status = 'WAITING_FOR_FULFILLMENT';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        payment_status: order.payment_status,
        service_status: order.service_status,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
