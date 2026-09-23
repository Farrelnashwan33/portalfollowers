import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pkg = await queryOne<any>('SELECT * FROM packages WHERE id = ?', [id]);

    if (!pkg) {
      return NextResponse.json({ success: false, error: 'Paket tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...pkg,
        price: Number(pkg.price),
        is_active: Boolean(pkg.is_active),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
