import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { packageSchema } from '@/lib/validations';
import { requireAdmin, logAdminActivity } from '@/lib/auth';

const updatePackagePartialSchema = packageSchema.partial();

// PATCH update package
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = requireAdmin(req);
  if (!user || response) return response;

  try {
    const { id } = await params;
    const body = await req.json();

    const validationResult = updatePackagePartialSchema.safeParse(body);
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

    const data = validationResult.data;
    const existing = await queryOne<any>('SELECT * FROM packages WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Paket tidak ditemukan.' }, { status: 404 });
    }

    const name = data.name !== undefined ? data.name : existing.name;
    const category = data.category !== undefined ? data.category : existing.category;
    const followers = data.followers !== undefined ? data.followers : existing.followers;
    const price = data.price !== undefined ? data.price : existing.price;
    const description = data.description !== undefined ? data.description : existing.description;
    const estimatedProcessingMinutes =
      data.estimatedProcessingMinutes !== undefined
        ? data.estimatedProcessingMinutes
        : existing.estimated_processing_minutes;
    const estimatedTime = data.estimatedTime !== undefined ? data.estimatedTime : existing.estimated_time;
    const badge = data.badge !== undefined ? data.badge : existing.badge;
    const providerServiceId = data.providerServiceId !== undefined ? data.providerServiceId : existing.provider_service_id;
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : existing.is_active;

    await execute(
      `UPDATE packages 
       SET name = ?, category = ?, followers = ?, price = ?, description = ?,
           estimated_processing_minutes = ?, estimated_time = ?, badge = ?,
           provider_service_id = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, category, followers, price, description, estimatedProcessingMinutes, estimatedTime, badge, providerServiceId, isActive, id]
    );

    const updatedPackage = await queryOne<any>('SELECT * FROM packages WHERE id = ?', [id]);

    await logAdminActivity(
      user,
      'UPDATE_PACKAGE',
      id,
      `Memperbarui paket ${name} (${category}, ${followers} followers, Rp${price})`
    );

    return NextResponse.json({
      success: true,
      message: 'Paket berhasil diperbarui.',
      data: {
        ...updatedPackage,
        price: Number(updatedPackage.price),
        is_active: Boolean(updatedPackage.is_active),
      },
    });
  } catch (error: any) {
    console.error('Error updating package:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE delete package (or soft-delete if orders exist)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = requireAdmin(req);
  if (!user || response) return response;

  try {
    const { id } = await params;
    const existing = await queryOne<any>('SELECT * FROM packages WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Paket tidak ditemukan.' }, { status: 404 });
    }

    // Check if package has existing orders
    const orderCount = await queryOne<any>('SELECT COUNT(*) AS total FROM orders WHERE package_id = ?', [id]);

    if (orderCount && Number(orderCount.total) > 0) {
      // Soft-delete to preserve foreign key integrity
      await execute('UPDATE packages SET is_active = 0, updated_at = NOW() WHERE id = ?', [id]);
      const deactivated = await queryOne<any>('SELECT * FROM packages WHERE id = ?', [id]);

      await logAdminActivity(
        user,
        'DEACTIVATE_PACKAGE',
        id,
        `Menonaktifkan paket ${existing.name} karena memiliki riwayat pesanan.`
      );

      return NextResponse.json({
        success: true,
        message: 'Paket memiliki riwayat pesanan, status telah diubah menjadi non-aktif.',
        data: {
          ...deactivated,
          price: Number(deactivated.price),
          is_active: Boolean(deactivated.is_active),
        },
      });
    }

    await execute('DELETE FROM packages WHERE id = ?', [id]);

    await logAdminActivity(user, 'DELETE_PACKAGE', id, `Menghapus paket permanen: ${existing.name}`);

    return NextResponse.json({
      success: true,
      message: 'Paket berhasil dihapus.',
    });
  } catch (error: any) {
    console.error('Error deleting package:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
