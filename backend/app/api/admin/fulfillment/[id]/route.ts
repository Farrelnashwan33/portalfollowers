import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminActivity } from '@/lib/auth';
import { queryOne, transaction } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';

const updateFulfillmentSchema = z.object({
  status: z.enum(['WAITING_FOR_FULFILLMENT', 'PROCESSING', 'PARTIALLY_COMPLETED', 'COMPLETED', 'FAILED']),
  provider: z.string().optional().nullable(),
  delivered_quantity: z.number().int().nonnegative().optional().nullable(),
  error_message: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = requireAdmin(req);
  if (!user || response) return response;

  try {
    const { id } = await params;
    const body = await req.json();
    const validatedData = updateFulfillmentSchema.parse(body);

    const currentTask: any = await queryOne('SELECT * FROM fulfillment_tasks WHERE id = ?', [id]);
    if (!currentTask) {
      return NextResponse.json({ success: false, error: 'Task fulfillment tidak ditemukan' }, { status: 404 });
    }

    const now = new Date();
    const completedAt = validatedData.status === 'COMPLETED' ? now : null;

    await transaction(async (connection) => {
      // Update fulfillment task
      await connection.execute(
        `UPDATE fulfillment_tasks 
         SET status = ?, 
             provider = COALESCE(?, provider),
             delivered_quantity = COALESCE(?, delivered_quantity),
             error_message = ?,
             completed_at = COALESCE(?, completed_at),
             updated_at = ?
         WHERE id = ?`,
        [
          validatedData.status,
          validatedData.provider ?? null,
          validatedData.delivered_quantity ?? (validatedData.status === 'COMPLETED' ? currentTask.requested_quantity : null),
          validatedData.error_message ?? null,
          completedAt,
          now,
          id
        ]
      );

      // If status changed to COMPLETED, update order status to COMPLETED
      if (validatedData.status === 'COMPLETED') {
        await connection.execute(
          `UPDATE orders SET service_status = 'COMPLETED', updated_at = ? WHERE id = ?`,
          [now, currentTask.order_id]
        );
        await connection.execute(
          `INSERT INTO order_status_history (id, order_id, status, note, created_at)
           VALUES (?, ?, 'COMPLETED', 'Layanan followers selesai diproses 100% (Fulfillment Selesai)', ?)`,
          [crypto.randomUUID(), currentTask.order_id, now]
        );
      } else if (validatedData.status === 'IN_PROGRESS') {
        await connection.execute(
          `UPDATE orders SET service_status = 'PROCESSING', updated_at = ? WHERE id = ?`,
          [now, currentTask.order_id]
        );
      } else if (validatedData.status === 'FAILED' || validatedData.status === 'CANCELLED') {
        await connection.execute(
          `UPDATE orders SET service_status = 'FAILED', updated_at = ? WHERE id = ?`,
          [now, currentTask.order_id]
        );
      }
    });

    await logAdminActivity(
      user,
      'UPDATE_FULFILLMENT',
      id,
      `Ubah status fulfillment ${currentTask.status} -> ${validatedData.status}`,
      req.headers.get('x-forwarded-for') || undefined
    );

    return NextResponse.json({
      success: true,
      message: 'Status fulfillment berhasil diperbarui'
    });
  } catch (error: any) {
    console.error('Update fulfillment error:', error);
    if (error.errors) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Gagal memperbarui status fulfillment' }, { status: 500 });
  }
}
