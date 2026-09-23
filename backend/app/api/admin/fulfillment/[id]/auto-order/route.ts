import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminActivity } from '@/lib/auth';
import { queryOne, transaction } from '@/lib/db';
import { medanpediaService } from '@/services/medanpedia.service';
import crypto from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = requireAdmin(req);
  if (!user || response) return response;

  try {
    const { id } = await params;
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const task: any = await queryOne(
      `SELECT f.*, o.order_code, o.instagram_username, o.followers_amount, o.customer_name,
              pkg.id as package_id, pkg.name as package_name, pkg.provider_service_id, pkg.category
       FROM fulfillment_tasks f
       JOIN orders o ON f.order_id = o.id
       JOIN packages pkg ON o.package_id = pkg.id
       WHERE f.id = ?`,
      [id]
    );

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task fulfillment tidak ditemukan' }, { status: 404 });
    }

    if (!medanpediaService.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Kredensial MedanPedia (API ID / API KEY) belum lengkap di .env.local',
      }, { status: 400 });
    }

    const serviceId = body.serviceId || task.provider_service_id;
    if (!serviceId) {
      return NextResponse.json({
        success: false,
        error: 'ID Layanan MedanPedia (Service ID) belum ditentukan untuk paket ini. Silakan pilih Service ID terlebih dahulu.',
      }, { status: 400 });
    }

    const target = task.instagram_username;
    const quantity = task.requested_quantity || task.followers_amount;

    // Send order to MedanPedia
    const orderRes = await medanpediaService.createOrder({
      serviceId,
      target,
      quantity,
    });

    const now = new Date();

    if (!orderRes.success || !orderRes.orderId) {
      // Record failed attempt
      await transaction(async (conn) => {
        await conn.execute(
          `UPDATE fulfillment_tasks 
           SET error_message = ?, updated_at = ? 
           WHERE id = ?`,
          [`Gagal kirim ke MedanPedia: ${orderRes.error}`, now, id]
        );
      });

      return NextResponse.json({
        success: false,
        error: orderRes.error || 'Gagal mengirim order ke MedanPedia',
        rawResponse: orderRes.rawResponse,
      }, { status: 400 });
    }

    const providerOrderId = String(orderRes.orderId);

    // Update fulfillment task and order status
    await transaction(async (conn) => {
      await conn.execute(
        `UPDATE fulfillment_tasks 
         SET provider = 'MEDANPEDIA',
             provider_order_id = ?,
             provider_status = 'Processing',
             status = 'PROCESSING',
             started_at = COALESCE(started_at, ?),
             error_message = NULL,
             updated_at = ?
         WHERE id = ?`,
        [providerOrderId, now, now, id]
      );

      await conn.execute(
        `UPDATE orders SET service_status = 'PROCESSING', updated_at = ? WHERE id = ?`,
        [now, task.order_id]
      );

      const historyId = crypto.randomUUID();
      await conn.execute(
        `INSERT INTO order_status_history (id, order_id, status, note, created_at)
         VALUES (?, ?, 'PROCESSING', ?, ?)`,
        [
          historyId,
          task.order_id,
          `Order berhasil diteruskan ke MedanPedia (Provider Order ID: ${providerOrderId}, Layanan: #${serviceId})`,
          now,
        ]
      );
    });

    await logAdminActivity(
      user,
      'MEDANPEDIA_AUTO_ORDER',
      id,
      `Kirim order ke MedanPedia: Task ${id} -> Provider ID ${providerOrderId}`,
      req.headers.get('x-forwarded-for') || undefined
    );

    return NextResponse.json({
      success: true,
      message: `Pesanan berhasil diteruskan ke MedanPedia! (ID: ${providerOrderId})`,
      providerOrderId,
      data: orderRes.rawResponse,
    });
  } catch (error: any) {
    console.error('Error creating auto-order to MedanPedia:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Terjadi kesalahan saat memproses order ke MedanPedia',
    }, { status: 500 });
  }
}
