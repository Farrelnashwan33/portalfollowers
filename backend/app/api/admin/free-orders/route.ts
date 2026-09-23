import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminActivity } from '@/lib/auth';
import { query, queryOne, transaction } from '@/lib/db';
import { generateOrderCode } from '@/lib/order-code';
import { z } from 'zod';
import crypto from 'crypto';

const createFreeOrderSchema = z.object({
  package_id: z.string(),
  target_username: z.string().min(1).max(100),
  customer_name: z.string().min(1).max(100).default('Admin Free Order'),
  customer_email: z.string().email().default('admin@portalfollowers.com'),
  customer_whatsapp: z.string().min(8).max(20).default('080000000000'),
  notes: z.string().optional()
});

export async function GET(req: NextRequest) {
  const { user, response } = requireAdmin(req);
  if (!user || response) return response;

  try {
    const orders = await query(`
      SELECT 
        o.*,
        pkg.name as package_name,
        pkg.category as package_category,
        pkg.followers as follower_amount,
        u.email as admin_creator_email
      FROM orders o
      LEFT JOIN packages pkg ON o.package_id = pkg.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.is_admin_order = TRUE OR o.payment_required = FALSE
      ORDER BY o.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      data: orders
    });
  } catch (error: any) {
    console.error('Fetch free admin orders error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data order gratis admin' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, response } = requireAdmin(req);
  if (!user || response) return response;

  try {
    const body = await req.json();
    const validatedData = createFreeOrderSchema.parse(body);

    // Fetch package details
    const pkg: any = await queryOne('SELECT * FROM packages WHERE id = ?', [validatedData.package_id]);
    if (!pkg) {
      return NextResponse.json({ success: false, error: 'Paket tidak ditemukan' }, { status: 404 });
    }

    const orderCode = await generateOrderCode();
    const cleanUsername = validatedData.target_username.replace(/^@/, '').trim();
    const newOrderId = crypto.randomUUID();
    const now = new Date();
    const followerCount = pkg.followers || pkg.amount || 100;

    await transaction(async (connection) => {
      // Insert Order with Rp 0 and ADMIN_APPROVED
      await connection.execute(
        `INSERT INTO orders (
          id, order_code, user_id, package_id, instagram_username,
          customer_name, customer_email, followers_amount,
          price, service_status, payment_status, payment_required, is_admin_order, admin_reason,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          0, 'ADMIN_APPROVED', 'PAID', FALSE, TRUE, ?,
          ?, ?
        )`,
        [
          newOrderId,
          orderCode,
          user.userId,
          validatedData.package_id,
          cleanUsername,
          validatedData.customer_name,
          validatedData.customer_email,
          followerCount,
          validatedData.notes || 'Order Gratis Khusus Admin',
          now,
          now
        ]
      );

      // Status history
      await connection.execute(
        `INSERT INTO order_status_history (id, order_id, status, note, created_at)
         VALUES (?, ?, 'ADMIN_APPROVED', 'Order gratis dibuat dan disetujui langsung oleh Admin', ?)`,
        [crypto.randomUUID(), newOrderId, now]
      );

      // Fulfillment task
      await connection.execute(
        `INSERT INTO fulfillment_tasks (
          id, order_id, provider, service_type, requested_quantity, delivered_quantity, status, created_at, updated_at
        ) VALUES (
          ?, ?, 'INTERNAL_ADMIN', 'INSTAGRAM_FOLLOWERS', ?, 0, 'WAITING_FOR_FULFILLMENT', ?, ?
        )`,
        [crypto.randomUUID(), newOrderId, followerCount, now, now]
      );
    });

    // Log admin activity
    await logAdminActivity(
      user,
      'CREATE_FREE_ORDER',
      newOrderId,
      `Order Gratis: ${orderCode} untuk @${cleanUsername} paket ${pkg.name}`,
      req.headers.get('x-forwarded-for') || undefined
    );

    return NextResponse.json({
      success: true,
      message: 'Order gratis khusus admin berhasil dibuat dan langsung diproses!',
      data: {
        order_id: newOrderId,
        order_code: orderCode,
        target_username: cleanUsername,
        package_name: pkg.name,
        amount: 0,
        status: 'ADMIN_APPROVED'
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create free admin order error:', error);
    if (error.errors) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Gagal membuat order gratis admin' }, { status: 500 });
  }
}
