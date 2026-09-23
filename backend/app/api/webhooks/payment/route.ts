import { NextRequest, NextResponse } from 'next/server';
import { queryOne, transaction } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received Payment Webhook:', body);

    const { order_id, transaction_status, fraud_status, status_code, gross_amount, signature_key } = body;

    if (!order_id) {
      return NextResponse.json({ success: false, error: 'order_id missing' }, { status: 400 });
    }

    // Optional: Signature verification for Midtrans if server key is set
    const serverKey = process.env.PAYMENT_SERVER_KEY;
    if (serverKey && signature_key && status_code && gross_amount) {
      const calculatedSignature = crypto
        .createHash('sha512')
        .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
        .digest('hex');

      if (calculatedSignature !== signature_key) {
        return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 403 });
      }
    }

    // Map transaction status
    let paymentStatus: 'pending' | 'paid' | 'failed' | 'expired' = 'pending';
    let serviceStatus: 'pending' | 'paid' | 'processing' | 'completed' | 'failed' = 'pending';

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        paymentStatus = 'paid';
        serviceStatus = 'processing';
      }
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'paid';
      serviceStatus = 'processing';
    } else if (transaction_status === 'cancel' || transaction_status === 'deny') {
      paymentStatus = 'failed';
      serviceStatus = 'failed';
    } else if (transaction_status === 'expire') {
      paymentStatus = 'expired';
      serviceStatus = 'failed';
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending';
      serviceStatus = 'pending';
    }

    const existingOrder = await queryOne<any>('SELECT * FROM orders WHERE order_code = ?', [order_id]);
    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const now = new Date();
    await transaction(async (conn) => {
      await conn.execute(
        'UPDATE orders SET payment_status = ?, service_status = ?, updated_at = ? WHERE order_code = ?',
        [paymentStatus, serviceStatus, now, order_id]
      );

      const historyId = crypto.randomUUID();
      const note =
        paymentStatus === 'paid'
          ? 'Pembayaran berhasil dikonfirmasi via Webhook Gateway.'
          : `Pembaruan status pembayaran: ${paymentStatus}`;

      await conn.execute(
        'INSERT INTO order_status_history (id, order_id, status, note, created_at) VALUES (?, ?, ?, ?, ?)',
        [historyId, existingOrder.id, serviceStatus, note, now]
      );
    });

    const updatedOrder = await queryOne<any>('SELECT * FROM orders WHERE order_code = ?', [order_id]);

    return NextResponse.json({
      success: true,
      message: `Order ${order_id} updated to payment: ${paymentStatus}, service: ${serviceStatus}`,
      data: updatedOrder,
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
