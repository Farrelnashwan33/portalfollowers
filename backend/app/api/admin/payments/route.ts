import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, response } = requireAdmin(req);
  if (!user || response) return response;

  try {
    const payments = await query(`
      SELECT 
        p.id, p.order_id, p.xendit_id, p.external_id,
        p.payment_method, p.channel_code, p.amount,
        p.status, p.paid_at, p.created_at,
        o.order_code, o.customer_name, o.customer_email, o.instagram_username
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      ORDER BY p.created_at DESC
    `);

    const webhookEvents = await query(`
      SELECT id, event_id, event_type, status, processed_at, created_at
      FROM webhook_events
      ORDER BY created_at DESC
      LIMIT 20
    `);

    return NextResponse.json({
      success: true,
      data: {
        payments: payments.map((p: any) => ({ ...p, amount: Number(p.amount) })),
        webhookEvents,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
