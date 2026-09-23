import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { medanpediaService } from '@/services/medanpedia.service';

export async function GET(req: NextRequest) {
  const { user, response } = requireAdmin(req);
  if (!user || response) return response;

  try {
    const isConfigured = medanpediaService.isConfigured();
    const apiId = medanpediaService.getApiId();

    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        configured: false,
        apiIdConfigured: Boolean(apiId),
        apiKeyConfigured: Boolean(process.env.MEDANPEDIA_API_KEY),
        error: !apiId
          ? 'MEDANPEDIA_API_ID belum diisi di .env.local'
          : 'MEDANPEDIA_API_KEY belum diisi di .env.local',
      });
    }

    const result = await medanpediaService.getProfile();

    if (!result.success) {
      return NextResponse.json({
        success: false,
        configured: true,
        error: result.error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      configured: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error('Error getting MedanPedia profile:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Gagal memeriksa profil MedanPedia',
    }, { status: 500 });
  }
}
