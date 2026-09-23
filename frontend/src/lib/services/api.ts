import type { Package, Order, CreateOrderPayload, Profile } from '$types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Default fallback packages when backend DB is temporarily unreachable
export const FALLBACK_PACKAGES: Package[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Starter Boost',
    followers: 100,
    price: 15000,
    description: 'Cocok untuk akun baru yang ingin meningkatkan social proof awal secara instan.',
    estimated_time: '1-3 Jam',
    badge: 'Pemula',
    is_active: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Creator Growth',
    followers: 500,
    price: 45000,
    description: 'Pilihan ideal bagi content creator untuk membangun kredibilitas profil dengan cepat.',
    estimated_time: '3-6 Jam',
    badge: 'Hemat',
    is_active: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Influencer Popular',
    followers: 1000,
    price: 79000,
    description: 'Paket paling diminati! Meningkatkan visibilitas algoritma dan daya tarik akun bisnis.',
    estimated_time: '6-12 Jam',
    badge: 'Paling Populer',
    is_active: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Brand Authority',
    followers: 2500,
    price: 175000,
    description: 'Dirancang khusus untuk brand, online shop, dan public figure yang butuh reputasi tinggi.',
    estimated_time: '12-24 Jam',
    badge: 'Best Value',
    is_active: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Enterprise Scale',
    followers: 5000,
    price: 320000,
    description: 'Akselerasi followers skala besar untuk dominasi industri dan tingkat konversi maksimal.',
    estimated_time: '24-48 Jam',
    badge: 'Sultan',
    is_active: true,
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'Ultimate Celebrity',
    followers: 10000,
    price: 590000,
    description: 'Solusi komprehensif pertumbuhan masif dengan pengiriman bertahap paling aman dan natural.',
    estimated_time: '2-3 Hari',
    badge: 'Eksklusif',
    is_active: true,
  },
];

// Helper to get auth header
function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ==========================================
// PACKAGES API
// ==========================================

export async function fetchPackages(): Promise<Package[]> {
  try {
    const res = await fetch(`${API_BASE}/api/packages`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        return json.data as Package[];
      }
    }
  } catch (e) {
    console.warn('Could not fetch packages from Backend API, using fallback packages:', e);
  }
  return FALLBACK_PACKAGES;
}

export async function fetchAllPackagesAdmin(): Promise<Package[]> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/packages`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) return json.data;
    }
  } catch (e) {
    console.warn('Backend API unreachable for admin packages, fallback:', e);
  }
  return FALLBACK_PACKAGES;
}

export async function createPackageAdmin(payload: any): Promise<{ success: boolean; data?: Package; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json;
  } catch (e: any) {
    return { success: false, error: e?.message || 'Gagal membuat paket.' };
  }
}

export async function updatePackageAdmin(id: string, payload: any): Promise<{ success: boolean; data?: Package; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/packages/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json;
  } catch (e: any) {
    return { success: false, error: e?.message || 'Gagal memperbarui paket.' };
  }
}

export async function deletePackageAdmin(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/packages/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json;
  } catch (e: any) {
    return { success: false, error: e?.message || 'Gagal menghapus paket.' };
  }
}

// ==========================================
// ORDERS API
// ==========================================

export async function createOrder(payload: CreateOrderPayload): Promise<{ success: boolean; data?: Order; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || 'Gagal memproses pesanan' };
    }
    return { success: true, data: result.data };
  } catch (e: any) {
    console.error('API createOrder error:', e);
    return { success: false, error: 'Gagal terhubung ke server database.' };
  }
}

export async function getOrder(idOrCode: string): Promise<{ success: boolean; data?: Order; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/orders/${idOrCode}`);
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) return { success: true, data: result.data };
    }
    const errJson = await res.json().catch(() => null);
    return { success: false, error: errJson?.error || 'Pesanan tidak ditemukan' };
  } catch (e: any) {
    console.error('API getOrder error:', e);
    return { success: false, error: 'Gagal memuat status pesanan.' };
  }
}

export async function fetchUserOrders(userId?: string): Promise<Order[]> {
  try {
    const url = userId ? `${API_BASE}/api/orders?userId=${userId}` : `${API_BASE}/api/orders`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) return json.data as Order[];
    }
  } catch (e) {
    console.error('Error fetching user orders:', e);
  }
  return [];
}

export async function fetchAllOrdersAdmin(): Promise<Order[]> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/orders`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) return json.data as Order[];
    }
  } catch (e) {
    console.error('Error fetching admin orders:', e);
  }
  return [];
}

export async function updateOrderStatus(
  idOrCode: string,
  updates: { paymentStatus?: string; serviceStatus?: string; adminNote?: string }
): Promise<{ success: boolean; data?: Order; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/orders/${idOrCode}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    });

    const result = await res.json();
    if (res.ok && result.success) return { success: true, data: result.data };
    return { success: false, error: result.error || 'Gagal memperbarui status pesanan' };
  } catch (e: any) {
    console.error('Backend update failed:', e);
    return { success: false, error: 'Gagal menghubungi server database.' };
  }
}

// ==========================================
// AUTH API (MySQL + Bcrypt + JWT)
// ==========================================

export async function loginApi(email: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const result = await res.json();
    return result;
  } catch (e: any) {
    return { success: false, error: 'Gagal terhubung ke server autentikasi.' };
  }
}

export async function registerApi(
  fullName: string,
  email: string,
  password: string,
  role = 'user'
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, role }),
    });
    const result = await res.json();
    return result;
  } catch (e: any) {
    return { success: false, error: 'Gagal terhubung ke server autentikasi.' };
  }
}

export async function getMeApi(token: string): Promise<{ success: boolean; data?: { user: any; profile: Profile }; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await res.json();
    return result;
  } catch (e: any) {
    return { success: false, error: 'Gagal memverifikasi sesi autentikasi.' };
  }
}

export async function forgotPasswordApi(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const result = await res.json();
    return result;
  } catch (e: any) {
    return { success: false, error: 'Gagal mengirim permintaan reset password.' };
  }
}

export async function resetPasswordApi(password: string, token?: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ password, token }),
    });
    const result = await res.json();
    return result;
  } catch (e: any) {
    return { success: false, error: 'Gagal mereset password.' };
  }
}

export async function trackOrderApi(orderCode: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/orders/track/${encodeURIComponent(orderCode)}`);
    const json = await res.json();
    return json;
  } catch (e: any) {
    return { success: false, error: 'Gagal melacak status pesanan.' };
  }
}

// ==========================================
// ADMIN SUITE API (Dashboard, Logs, Free Orders, Fulfillment, Payments, Customers)
// ==========================================

export async function fetchAdminDashboard(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json;
  } catch (e: any) {
    return { success: false, error: 'Gagal memuat data dashboard admin.' };
  }
}

export async function fetchAdminCustomers(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/customers`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json;
  } catch (e: any) {
    return { success: false, error: 'Gagal memuat data pelanggan.' };
  }
}

export async function fetchAdminPayments(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/payments`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json;
  } catch (e: any) {
    return { success: false, error: 'Gagal memuat riwayat pembayaran.' };
  }
}

export async function fetchAdminLogs(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/logs`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json;
  } catch (e: any) {
    return { success: false, error: 'Gagal memuat log aktivitas admin.' };
  }
}

export async function fetchAdminFreeOrders(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/free-orders`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json;
  } catch (e: any) {
    return { success: false, error: 'Gagal memuat order gratis admin.' };
  }
}

export async function createAdminFreeOrder(payload: {
  package_id: string;
  target_username: string;
  customer_name?: string;
  customer_email?: string;
  customer_whatsapp?: string;
  notes?: string;
}): Promise<{ success: boolean; data?: any; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/free-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json;
  } catch (e: any) {
    return { success: false, error: 'Gagal membuat order gratis admin.' };
  }
}

export async function fetchAdminFulfillment(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/fulfillment`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json;
  } catch (e: any) {
    return { success: false, error: 'Gagal memuat data fulfillment.' };
  }
}

export async function updateAdminFulfillment(
  id: string,
  payload: {
    status: string;
    provider_order_id?: string;
    start_count?: number;
    remains?: number;
    error_message?: string;
    notes?: string;
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/fulfillment/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json;
  } catch (e: any) {
    return { success: false, error: 'Gagal memperbarui task fulfillment.' };
  }
}

export async function fetchMedanpediaProfile(): Promise<{
  success: boolean;
  configured?: boolean;
  data?: { username?: string; balance?: number };
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/medanpedia/profile`, {
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, error: 'Gagal mengambil data profil MedanPedia.' };
  }
}

export async function fetchMedanpediaServices(): Promise<{
  success: boolean;
  data?: Array<{ id: string | number; category: string; name: string; price: number; min: number; max: number; status: string }>;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/medanpedia/services`, {
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, error: 'Gagal mengambil daftar layanan MedanPedia.' };
  }
}

export async function syncMedanpediaFulfillment(
  taskId?: string
): Promise<{ success: boolean; message?: string; syncedCount?: number; results?: any[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/fulfillment/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ taskId }),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, error: 'Gagal menyinkronkan status dari MedanPedia.' };
  }
}

export async function triggerMedanpediaAutoOrder(
  taskId: string,
  serviceId?: string
): Promise<{ success: boolean; message?: string; providerOrderId?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/fulfillment/${taskId}/auto-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ serviceId }),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, error: 'Gagal memproses auto-order MedanPedia.' };
  }
}


