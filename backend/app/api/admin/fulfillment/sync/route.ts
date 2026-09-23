import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminActivity } from '@/lib/auth';
import { query, queryOne, transaction } from '@/lib/db';
import { medanpediaService } from '@/services/medanpedia.service';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const { user, response } = requireAdmin(req);
  if (!user || response) return response;

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { taskId } = body;

    let tasksToSync: any[] = [];

    if (taskId) {
      const task = await queryOne(
        `SELECT f.*, o.order_code, o.id as order_id_val 
         FROM fulfillment_tasks f 
         JOIN orders o ON f.order_id = o.id 
         WHERE f.id = ?`,
        [taskId]
      );
      if (!task) {
        return NextResponse.json({ success: false, error: 'Task fulfillment tidak ditemukan' }, { status: 404 });
      }
      if (!task.provider_order_id) {
        return NextResponse.json({
          success: false,
          error: 'Task ini belum memiliki Provider Order ID dari MedanPedia',
        }, { status: 400 });
      }
      tasksToSync = [task];
    } else {
      // Sync all active tasks with provider_order_id
      tasksToSync = await query(
        `SELECT f.*, o.order_code, o.id as order_id_val 
         FROM fulfillment_tasks f 
         JOIN orders o ON f.order_id = o.id 
         WHERE f.provider_order_id IS NOT NULL 
           AND f.status IN ('WAITING_FOR_FULFILLMENT', 'PROCESSING')
         ORDER BY f.updated_at ASC LIMIT 50`
      );
    }

    if (tasksToSync.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada task dengan provider order ID aktif yang perlu disinkronkan.',
        syncedCount: 0,
      });
    }

    const syncResults: any[] = [];

    for (const task of tasksToSync) {
      try {
        const checkRes = await medanpediaService.checkStatus(task.provider_order_id);

        if (!checkRes.success) {
          syncResults.push({
            taskId: task.id,
            providerOrderId: task.provider_order_id,
            success: false,
            error: checkRes.error,
          });
          continue;
        }

        const rawStatus = (checkRes.status || '').toLowerCase();
        const startCount = checkRes.startCount ?? task.start_count ?? 0;
        const remains = checkRes.remains ?? task.remains ?? 0;

        let newFulfillmentStatus = task.status;
        let newOrderServiceStatus = null;
        let deliveredQty = task.delivered_quantity || 0;

        if (rawStatus.includes('success') || rawStatus.includes('completed')) {
          newFulfillmentStatus = 'COMPLETED';
          newOrderServiceStatus = 'COMPLETED';
          deliveredQty = task.requested_quantity;
        } else if (rawStatus.includes('processing') || rawStatus.includes('in progress')) {
          newFulfillmentStatus = 'PROCESSING';
          newOrderServiceStatus = 'PROCESSING';
          if (remains > 0 && remains < task.requested_quantity) {
            deliveredQty = task.requested_quantity - remains;
          }
        } else if (rawStatus.includes('partial')) {
          newFulfillmentStatus = 'PARTIALLY_COMPLETED';
          newOrderServiceStatus = 'PARTIALLY_COMPLETED';
          deliveredQty = Math.max(0, task.requested_quantity - remains);
        } else if (rawStatus.includes('error') || rawStatus.includes('canceled') || rawStatus.includes('cancelled')) {
          newFulfillmentStatus = 'FAILED';
          newOrderServiceStatus = 'FAILED';
        } else if (rawStatus.includes('pending')) {
          newFulfillmentStatus = 'PROCESSING';
          newOrderServiceStatus = 'PROCESSING';
        }

        const now = new Date();
        const completedAt = newFulfillmentStatus === 'COMPLETED' ? now : (task.completed_at || null);

        await transaction(async (conn) => {
          await conn.execute(
            `UPDATE fulfillment_tasks 
             SET status = ?,
                 provider_status = ?,
                 start_count = ?,
                 remains = ?,
                 delivered_quantity = ?,
                 completed_at = ?,
                 updated_at = ?
             WHERE id = ?`,
            [
              newFulfillmentStatus,
              checkRes.status,
              startCount,
              remains,
              deliveredQty,
              completedAt,
              now,
              task.id,
            ]
          );

          if (newOrderServiceStatus) {
            await conn.execute(
              `UPDATE orders SET service_status = ?, updated_at = ? WHERE id = ?`,
              [newOrderServiceStatus, now, task.order_id]
            );

            if (task.status !== newFulfillmentStatus) {
              const historyId = crypto.randomUUID();
              await conn.execute(
                `INSERT INTO order_status_history (id, order_id, status, note, created_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                  historyId,
                  task.order_id,
                  newOrderServiceStatus,
                  `Sinkronisasi otomatis MedanPedia: Status berubah menjadi ${checkRes.status} (Delivered: ${deliveredQty}/${task.requested_quantity})`,
                  now,
                ]
              );
            }
          }
        });

        syncResults.push({
          taskId: task.id,
          orderCode: task.order_code,
          providerOrderId: task.provider_order_id,
          providerStatus: checkRes.status,
          newStatus: newFulfillmentStatus,
          startCount,
          remains,
          deliveredQty,
          success: true,
        });
      } catch (err: any) {
        console.error(`Error syncing task ${task.id}:`, err);
        syncResults.push({
          taskId: task.id,
          providerOrderId: task.provider_order_id,
          success: false,
          error: err.message,
        });
      }
    }

    await logAdminActivity(
      user,
      'SYNC_MEDANPEDIA_STATUS',
      taskId || 'ALL',
      `Sinkronisasi status ${syncResults.length} task dengan MedanPedia`,
      req.headers.get('x-forwarded-for') || undefined
    );

    return NextResponse.json({
      success: true,
      message: `Berhasil menyinkronkan ${syncResults.filter((r) => r.success).length} task dari MedanPedia.`,
      syncedCount: syncResults.length,
      results: syncResults,
    });
  } catch (error: any) {
    console.error('Fulfillment sync error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Gagal menyinkronkan status dengan MedanPedia',
    }, { status: 500 });
  }
}
