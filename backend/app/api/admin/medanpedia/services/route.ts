import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { medanpediaService } from '@/services/medanpedia.service';

export async function GET(req: NextRequest) {
  const { user, response } = requireAdmin(req);
  if (!user || response) return response;

  try {
    if (!medanpediaService.isConfigured()) {
      return NextResponse.json({
        success: false,
        configured: false,
        error: 'Kredensial MedanPedia belum lengkap di .env.local',
      }, { status: 400 });
    }

    const result = await medanpediaService.getServices();

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error('Error fetching MedanPedia services:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Gagal mengambil daftar layanan MedanPedia',
    }, { status: 500 });
  }
}
