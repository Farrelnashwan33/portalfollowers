import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute, transaction } from '@/lib/db';
import { xenditService } from '@/services/xendit.service';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const incomingToken = req.headers.get('x-callback-token');

    // 1. Verify Webhook Token
    if (!xenditService.verifyWebhookToken(incomingToken)) {
      console.warn('❌ Xendit Webhook Unauthorized: Invalid x-callback-token');
      return NextResponse.json({ success: false, error: 'Unauthorized callback token' }, { status: 403 });
    }

    const body = await req.json();
    console.log('🔔 Received Xendit Webhook:', JSON.stringify(body));

    const eventId = body.id || body.payment_id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const eventType = body.event || body.status || 'INVOICE_PAID';

    // 2. Idempotency Check: Prevent duplicate event processing
    const existingEvent = await queryOne('SELECT id FROM webhook_events WHERE event_id = ?', [eventId]);
    if (existingEvent) {
      console.log(`ℹ️ Duplicate webhook event ignored: ${eventId}`);
      return NextResponse.json({ success: true, message: 'Event already processed' }, { status: 200 });
    }

    // Record incoming webhook event
    const webhookEventId = crypto.randomUUID();
    await execute(
      `INSERT INTO webhook_events (id, event_id, event_type, payload_json, status, processed_at, created_at)
       VALUES (?, ?, ?, ?, 'PROCESSED', NOW(), NOW())`,
      [webhookEventId, eventId, eventType, JSON.stringify(body)]
    );

    // 3. Extract Order Information
    const externalId = body.external_id;
    const invoiceStatus = (body.status || '').toUpperCase();
    const paidAmount = Number(body.paid_amount || body.amount || 0);
    const paymentMethod = body.payment_method || body.payment_channel || 'XENDIT';
    const channelCode = body.payment_channel || body.bank_code || body.ewallet_type || null;
    const paidAt = body.paid_at ? new Date(body.paid_at) : new Date();

    if (!externalId) {
      return NextResponse.json({ success: true, message: 'No external_id found in webhook' }, { status: 200 });
    }

    // 4. Find Associated Order
    const order = await queryOne<any>('SELECT * FROM orders WHERE order_code = ? OR id = ?', [externalId, externalId]);
    if (!order) {
      console.warn(`⚠️ Order not found for webhook external_id: ${externalId}`);
      return NextResponse.json({ success: true, message: 'Order not found, logged event' }, { status: 200 });
    }

    // 5. Handle Status Transitions
    if (invoiceStatus === 'PAID' || invoiceStatus === 'SETTLED') {
      // Ensure payment is not processed repeatedly
      if (order.payment_status !== 'PAID') {
        // Validate nominal amount
        const expectedPrice = Number(order.price);
        if (paidAmount > 0 && Math.abs(paidAmount - expectedPrice) > 100) {
          console.warn(`⚠️ Payment amount mismatch for order ${order.order_code}: expected ${expectedPrice}, got ${paidAmount}`);
        }

        const now = new Date();
        await transaction(async (conn) => {
          // A. Update Order Status
          await conn.execute(
            `UPDATE orders 
             SET payment_status = 'PAID', service_status = 'WAITING_FOR_FULFILLMENT', updated_at = ?
             WHERE id = ?`,
            [now, order.id]
          );

          // B. Record Order Status History
          const historyId = crypto.randomUUID();
          await conn.execute(
            `INSERT INTO order_status_history (id, order_id, status, note, created_at)
             VALUES (?, ?, 'PAID', ?, ?)`,
            [historyId, order.id, `Pembayaran ${paymentMethod} sebesar Rp${expectedPrice.toLocaleString('id-ID')} berhasil diverifikasi.`, now]
          );

          // C. Record Payment Log
          const paymentLogId = crypto.randomUUID();
          await conn.execute(
            `INSERT INTO payments (id, order_id, xendit_id, external_id, payment_method, channel_code, amount, status, paid_at, payload_json, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'PAID', ?, ?, ?, ?)`,
            [
              paymentLogId,
              order.id,
              body.id || null,
              externalId,
              paymentMethod,
              channelCode,
              paidAmount || expectedPrice,
              paidAt,
              JSON.stringify(body),
              now,
              now,
            ]
          );

          // D. Create Fulfillment Task
          const fulfillmentTaskId = crypto.randomUUID();
          await conn.execute(
            `INSERT INTO fulfillment_tasks (
              id, order_id, provider, service_type, requested_quantity,
              delivered_quantity, status, created_at, updated_at
            ) VALUES (?, ?, 'INTERNAL', 'INSTAGRAM_FOLLOWERS', ?, 0, 'WAITING_FOR_FULFILLMENT', ?, ?)`,
            [fulfillmentTaskId, order.id, order.followers_amount, now, now]
          );
        });

        console.log(`✅ Order ${order.order_code} successfully marked as PAID with fulfillment task created.`);
      }
    } else if (invoiceStatus === 'EXPIRED') {
      if (order.payment_status === 'PENDING_PAYMENT') {
        const now = new Date();
        await transaction(async (conn) => {
          await conn.execute("UPDATE orders SET payment_status = 'EXPIRED', service_status = 'CANCELLED', updated_at = ? WHERE id = ?", [now, order.id]);
          const historyId = crypto.randomUUID();
          await conn.execute("INSERT INTO order_status_history (id, order_id, status, note, created_at) VALUES (?, ?, 'EXPIRED', 'Waktu pembayaran telah kedaluwarsa.', ?)", [historyId, order.id, now]);
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Webhook event processed for order ${externalId}`,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing Xendit webhook:', error);
    // Always return 200 to Xendit after internal logging to avoid unnecessary retries
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
