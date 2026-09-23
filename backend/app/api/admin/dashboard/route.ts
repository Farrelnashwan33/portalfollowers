import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, response } = requireAdmin(req);
  if (!user || response) return response;

  try {
    // 1. Metrics Aggregation
    const totalOrdersRes = await queryOne<any>('SELECT COUNT(*) AS count FROM orders');
    const todayOrdersRes = await queryOne<any>(
      'SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = CURDATE()'
    );
    const paidOrdersRes = await queryOne<any>(
      "SELECT COUNT(*) AS count, COALESCE(SUM(price), 0) AS total_revenue FROM orders WHERE payment_status = 'PAID'"
    );
    const pendingOrdersRes = await queryOne<any>(
      "SELECT COUNT(*) AS count FROM orders WHERE payment_status = 'PENDING_PAYMENT'"
    );
    const processingOrdersRes = await queryOne<any>(
      "SELECT COUNT(*) AS count FROM orders WHERE service_status IN ('PROCESSING', 'WAITING_FOR_FULFILLMENT')"
    );
    const completedOrdersRes = await queryOne<any>(
      "SELECT COUNT(*) AS count FROM orders WHERE service_status = 'COMPLETED'"
    );
    const failedOrdersRes = await queryOne<any>(
      "SELECT COUNT(*) AS count FROM orders WHERE service_status = 'FAILED' OR payment_status = 'FAILED'"
    );
    const totalCustomersRes = await queryOne<any>(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'CUSTOMER'"
    );

    // 2. Recent 10 Orders
    const recentOrders = await query(`
      SELECT 
        o.id, o.order_code, o.customer_name, o.customer_email,
        o.instagram_username, o.followers_amount, o.price,
        o.payment_status, o.service_status, o.payment_method,
        o.is_admin_order, o.created_at,
        p.name AS package_name, p.category AS package_category
      FROM orders o
      LEFT JOIN packages p ON o.package_id = p.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    // 3. Category Breakdown
    const categoryBreakdown = await query(`
      SELECT p.category, COUNT(o.id) as order_count, COALESCE(SUM(o.price), 0) as total_amount
      FROM orders o
      JOIN packages p ON o.package_id = p.id
      WHERE o.payment_status = 'PAID'
      GROUP BY p.category
    `);

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalOrders: Number(totalOrdersRes?.count || 0),
          todayOrders: Number(todayOrdersRes?.count || 0),
          paidOrders: Number(paidOrdersRes?.count || 0),
          totalRevenue: Number(paidOrdersRes?.total_revenue || 0),
          pendingPayments: Number(pendingOrdersRes?.count || 0),
          processingOrders: Number(processingOrdersRes?.count || 0),
          completedOrders: Number(completedOrdersRes?.count || 0),
          failedOrders: Number(failedOrdersRes?.count || 0),
          totalCustomers: Number(totalCustomersRes?.count || 0),
        },
        recentOrders: recentOrders.map((o: any) => ({
          ...o,
          price: Number(o.price),
          is_admin_order: Boolean(o.is_admin_order),
        })),
        categoryBreakdown,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin dashboard:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
