import { NextRequest, NextResponse } from 'next/server';
import { queryOne, transaction } from '@/lib/db';
import { updateOrderStatusSchema } from '@/lib/validations';
import crypto from 'crypto';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const validationResult = updateOrderStatusSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      );
    }

    const { paymentStatus, serviceStatus, adminNote } = validationResult.data;

    // Check existing order
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const findSql = `SELECT * FROM orders WHERE ${isUuid ? 'id = ?' : 'order_code = ?'}`;
    const existingOrder = await queryOne<any>(findSql, [isUuid ? id : id.toUpperCase()]);

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    const newPaymentStatus = paymentStatus || existingOrder.payment_status;
    const newServiceStatus = serviceStatus || existingOrder.service_status;
    const newAdminNote = adminNote !== undefined ? adminNote : existingOrder.admin_note;
    const now = new Date();

    // Determine status history note
    let historyNote = newAdminNote;
    if (newPaymentStatus === 'paid' && existingOrder.payment_status !== 'paid') {
      historyNote = 'Pembayaran telah terverifikasi.';
    } else if (newServiceStatus === 'processing' && existingOrder.service_status !== 'processing') {
      historyNote = 'Pesanan sedang diproses dan dialokasikan ke akun Instagram target.';
    } else if (newServiceStatus === 'completed' && existingOrder.service_status !== 'completed') {
      historyNote = 'Layanan telah selesai dikirim secara penuh.';
    } else if (newServiceStatus === 'failed' && existingOrder.service_status !== 'failed') {
      historyNote = 'Pesanan dibatalkan atau mengalami kegagalan proses.';
    } else if (!historyNote) {
      historyNote = 'Pembaruan status dari admin.';
    }

    await transaction(async (conn) => {
      // 1. Update Order
      await conn.execute(
        `UPDATE orders 
         SET payment_status = ?, service_status = ?, admin_note = ?, updated_at = ?
         WHERE id = ?`,
        [newPaymentStatus, newServiceStatus, newAdminNote, now, existingOrder.id]
      );

      // 2. Insert Order Status History
      const historyId = crypto.randomUUID();
      await conn.execute(
        'INSERT INTO order_status_history (id, order_id, status, note, created_at) VALUES (?, ?, ?, ?, ?)',
        [historyId, existingOrder.id, newServiceStatus, historyNote, now]
      );
    });

    // Fetch updated order
    const updatedOrder = await queryOne<any>(
      `SELECT o.*, p.name AS package_name, p.badge AS package_badge, p.estimated_time AS package_estimated_time
       FROM orders o
       LEFT JOIN packages p ON o.package_id = p.id
       WHERE o.id = ?`,
      [existingOrder.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Status pesanan berhasil diperbarui.',
      data: {
        ...updatedOrder,
        price: Number(updatedOrder.price),
        packages: updatedOrder.package_id
          ? {
              id: updatedOrder.package_id,
              name: updatedOrder.package_name,
              badge: updatedOrder.package_badge,
              estimated_time: updatedOrder.package_estimated_time,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error('Unhandled PATCH /api/admin/orders/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', details: error?.message },
      { status: 500 }
    );
  }
}
