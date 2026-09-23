import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, transaction } from '@/lib/db';
import { createOrderSchema } from '@/lib/validations';
import { generateOrderCode } from '@/lib/order-code';
import { xenditService } from '@/services/xendit.service';
import crypto from 'crypto';

// GET orders with optional userId or search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let sql = `
      SELECT 
        o.id,
        o.order_code,
        o.user_id,
        o.package_id,
        o.customer_name,
        o.customer_email,
        o.instagram_username,
        o.instagram_url,
        o.followers_amount,
        o.price,
        o.payment_status,
        o.service_status,
        o.payment_method,
        o.xendit_invoice_id,
        o.xendit_payment_url,
        o.is_admin_order,
        o.payment_required,
        o.customer_note,
        o.admin_note,
        o.created_at,
        o.updated_at,
        p.name AS package_name,
        p.category AS package_category,
        p.badge AS package_badge,
        p.estimated_processing_minutes AS package_estimated_minutes,
        p.estimated_time AS package_estimated_time,
        p.description AS package_description
      FROM orders o
      LEFT JOIN packages p ON o.package_id = p.id
    `;
    const params: any[] = [];

    if (userId) {
      sql += ' WHERE o.user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY o.created_at DESC';

    const rawOrders = await query(sql, params);

    const formattedOrders = rawOrders.map((ord: any) => ({
      id: ord.id,
      order_code: ord.order_code,
      user_id: ord.user_id,
      package_id: ord.package_id,
      customer_name: ord.customer_name,
      customer_email: ord.customer_email,
      instagram_username: ord.instagram_username,
      instagram_url: ord.instagram_url,
      followers_amount: ord.followers_amount,
      price: Number(ord.price),
      payment_status: ord.payment_status,
      service_status: ord.service_status,
      payment_method: ord.payment_method,
      xendit_invoice_id: ord.xendit_invoice_id,
      xendit_payment_url: ord.xendit_payment_url,
      is_admin_order: Boolean(ord.is_admin_order),
      payment_required: Boolean(ord.payment_required),
      customer_note: ord.customer_note,
      admin_note: ord.admin_note,
      created_at: ord.created_at,
      updated_at: ord.updated_at,
      packages: ord.package_id
        ? {
            id: ord.package_id,
            name: ord.package_name,
            category: ord.package_category,
            badge: ord.package_badge,
            estimated_processing_minutes: ord.package_estimated_minutes,
            estimated_time: ord.package_estimated_time,
            description: ord.package_description,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedOrders,
    });
  } catch (error: any) {
    console.error('Error in GET /api/orders:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar pesanan.', details: error?.message },
      { status: 500 }
    );
  }
}

// POST create a new customer order with Xendit transaction
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate Input Data
    const validationResult = createOrderSchema.safeParse(body);
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

    const { packageId, customerName, customerEmail, instagramUsername, paymentMethod, customerNote, userId } =
      validationResult.data;

    // 2. Fetch the Package directly from Database to guarantee verified pricing
    const pkg = await queryOne<any>('SELECT * FROM packages WHERE id = ?', [packageId]);

    if (!pkg) {
      return NextResponse.json(
        { success: false, error: 'Paket followers yang dipilih tidak ditemukan atau sudah tidak tersedia.' },
        { status: 404 }
      );
    }

    if (!pkg.is_active) {
      return NextResponse.json(
        { success: false, error: 'Paket ini sedang dinonaktifkan sementara.' },
        { status: 400 }
      );
    }

    // 3. Prepare Order Information with Immutable DB Price
    const orderId = crypto.randomUUID();
    const orderCode = generateOrderCode();
    const instagramUrl = `https://www.instagram.com/${instagramUsername}/`;
    const followersAmount = pkg.followers;
    const finalPrice = Number(pkg.price);
    const now = new Date();

    // 4. Create Xendit Invoice for Payment Gateway
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const xenditResult = await xenditService.createInvoice({
      externalId: orderCode,
      amount: finalPrice,
      payerEmail: customerEmail,
      customerName: customerName,
      description: `PortalFollowers - Order ${orderCode} (${pkg.name} untuk @${instagramUsername})`,
      successRedirectUrl: `${frontendUrl}/order/${orderCode}?payment=success`,
      failureRedirectUrl: `${frontendUrl}/order/${orderCode}?payment=failed`,
    });

    const xenditInvoiceId = xenditResult.data?.id || null;
    const xenditPaymentUrl = xenditResult.data?.invoice_url || null;

    // 5. Save Order and History in MySQL Transaction
    await transaction(async (conn) => {
      // Insert Order
      await conn.execute(
        `INSERT INTO orders (
          id, order_code, user_id, package_id, customer_name, customer_email,
          instagram_username, instagram_url, followers_amount, price,
          payment_status, service_status, payment_method, xendit_invoice_id,
          xendit_payment_url, is_admin_order, payment_required, customer_note,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          orderCode,
          userId || null,
          pkg.id,
          customerName,
          customerEmail,
          instagramUsername,
          instagramUrl,
          followersAmount,
          finalPrice,
          'PENDING_PAYMENT',
          'PENDING_PAYMENT',
          paymentMethod || 'xendit',
          xenditInvoiceId,
          xenditPaymentUrl,
          0,
          1,
          customerNote || null,
          now,
          now,
        ]
      );

      // Insert Initial Order Status History
      const historyId = crypto.randomUUID();
      await conn.execute(
        'INSERT INTO order_status_history (id, order_id, status, note, created_at) VALUES (?, ?, ?, ?, ?)',
        [historyId, orderId, 'PENDING_PAYMENT', 'Pesanan dibuat. Menunggu pembayaran dari customer.', now]
      );
    });

    const newOrder = {
      id: orderId,
      order_code: orderCode,
      user_id: userId || null,
      package_id: pkg.id,
      customer_name: customerName,
      customer_email: customerEmail,
      instagram_username: instagramUsername,
      instagram_url: instagramUrl,
      followers_amount: followersAmount,
      price: finalPrice,
      payment_status: 'PENDING_PAYMENT',
      service_status: 'PENDING_PAYMENT',
      payment_method: paymentMethod || 'xendit',
      xendit_invoice_id: xenditInvoiceId,
      xendit_payment_url: xenditPaymentUrl,
      is_admin_order: false,
      payment_required: true,
      customer_note: customerNote || null,
      created_at: now.toISOString(),
      packages: {
        id: pkg.id,
        name: pkg.name,
        category: pkg.category,
        badge: pkg.badge,
        estimated_processing_minutes: pkg.estimated_processing_minutes,
        estimated_time: pkg.estimated_time,
      },
      order_status_history: [
        {
          id: crypto.randomUUID(),
          order_id: orderId,
          status: 'PENDING_PAYMENT',
          note: 'Pesanan dibuat. Menunggu pembayaran dari customer.',
          created_at: now.toISOString(),
        },
      ],
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Pesanan berhasil dibuat. Silakan lanjutkan ke pembayaran Xendit.',
        data: newOrder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Unhandled POST /api/orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', details: error?.message },
      { status: 500 }
    );
  }
}
