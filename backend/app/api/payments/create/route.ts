import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { xenditService } from '@/services/xendit.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId wajib diisi.' }, { status: 400 });
    }

    const order = await queryOne<any>(
      `SELECT o.*, p.name AS package_name 
       FROM orders o 
       LEFT JOIN packages p ON o.package_id = p.id 
       WHERE o.id = ? OR o.order_code = ?`,
      [orderId, orderId]
    );

    if (!order) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    if (order.payment_status === 'PAID') {
      return NextResponse.json({
        success: true,
        message: 'Pesanan ini sudah lunas.',
        data: { payment_url: order.xendit_payment_url, payment_status: 'PAID' },
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const xenditResult = await xenditService.createInvoice({
      externalId: order.order_code,
      amount: Number(order.price),
      payerEmail: order.customer_email,
      customerName: order.customer_name,
      description: `PortalFollowers - Order ${order.order_code} (${order.package_name})`,
      successRedirectUrl: `${frontendUrl}/order/${order.order_code}?payment=success`,
      failureRedirectUrl: `${frontendUrl}/order/${order.order_code}?payment=failed`,
    });

    if (!xenditResult.success || !xenditResult.data) {
      return NextResponse.json(
        { success: false, error: xenditResult.error || 'Gagal membuat transaksi Xendit.' },
        { status: 500 }
      );
    }

    await execute(
      'UPDATE orders SET xendit_invoice_id = ?, xendit_payment_url = ?, updated_at = NOW() WHERE id = ?',
      [xenditResult.data.id, xenditResult.data.invoice_url, order.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Transaksi Xendit berhasil dibuat.',
      data: {
        invoice_id: xenditResult.data.id,
        payment_url: xenditResult.data.invoice_url,
      },
    });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
