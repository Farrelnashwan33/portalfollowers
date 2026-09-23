export interface MedanPediaProfile {
  username?: string;
  balance?: number;
  [key: string]: any;
}

export interface MedanPediaServiceItem {
  id: string | number;
  category: string;
  name: string;
  price: number;
  min: number;
  max: number;
  status: string;
  note?: string;
  type?: string;
}

export interface MedanPediaOrderStatus {
  id: string | number;
  status: 'Pending' | 'Processing' | 'In progress' | 'Completed' | 'Success' | 'Partial' | 'Canceled' | 'Error' | string;
  start_count?: number;
  remains?: number;
  [key: string]: any;
}

export class MedanPediaService {
  private getCredentials() {
    return {
      apiId: process.env.MEDANPEDIA_API_ID || '',
      apiKey: process.env.MEDANPEDIA_API_KEY || '',
      baseUrl: process.env.MEDANPEDIA_API_URL || 'https://api.medanpedia.co.id',
    };
  }

  public isConfigured(): boolean {
    const { apiId, apiKey } = this.getCredentials();
    return Boolean(apiId && apiKey);
  }

  public getApiId(): string {
    return this.getCredentials().apiId;
  }

  private async request<T = any>(endpoint: string, payload: Record<string, any> = {}): Promise<{ success: boolean; data?: T; error?: string }> {
    const { apiId, apiKey, baseUrl } = this.getCredentials();

    if (!apiKey) {
      return {
        success: false,
        error: 'MEDANPEDIA_API_KEY belum dikonfigurasi di environment (.env.local)',
      };
    }

    if (!apiId) {
      return {
        success: false,
        error: 'MEDANPEDIA_API_ID (User ID akun MedanPedia) belum dikonfigurasi di environment (.env.local)',
      };
    }

    const url = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    const formData = new URLSearchParams();
    formData.append('api_id', apiId);
    formData.append('api_key', apiKey);

    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const responseText = await response.text();
      let resJson: any;

      try {
        resJson = JSON.parse(responseText);
      } catch (err) {
        console.error('MedanPedia API response is not JSON:', responseText);
        return {
          success: false,
          error: `Respons API MedanPedia tidak valid (HTTP ${response.status}): ${responseText.substring(0, 150)}`,
        };
      }

      // MedanPedia returns status: true/false or response status
      if (resJson.status === true || resJson.status === 'success' || resJson.status === 1) {
        return {
          success: true,
          data: resJson.data || resJson,
        };
      } else {
        const errorMsg =
          resJson.data?.msg ||
          resJson.data?.message ||
          resJson.msg ||
          resJson.message ||
          resJson.error ||
          'Terjadi kesalahan dari API MedanPedia';
        return {
          success: false,
          error: String(errorMsg),
          data: resJson,
        };
      }
    } catch (err: any) {
      console.error('MedanPedia Network Request Error:', err);
      return {
        success: false,
        error: err.message || 'Koneksi ke API MedanPedia gagal',
      };
    }
  }

  /**
   * Cek Profil & Saldo Akun MedanPedia
   */
  public async getProfile(): Promise<{ success: boolean; data?: MedanPediaProfile; error?: string }> {
    const res = await this.request<MedanPediaProfile>('profile');
    return res;
  }

  /**
   * Ambil Daftar Layanan MedanPedia
   */
  public async getServices(): Promise<{ success: boolean; data?: MedanPediaServiceItem[]; error?: string }> {
    const res = await this.request<MedanPediaServiceItem[]>('services');
    return res;
  }

  /**
   * Kirim Order Baru ke MedanPedia
   */
  public async createOrder(params: {
    serviceId: string | number;
    target: string;
    quantity: number;
    customComments?: string;
    customLink?: string;
  }): Promise<{ success: boolean; orderId?: string | number; rawResponse?: any; error?: string }> {
    // Clean target (username / link)
    let cleanTarget = params.target.trim();
    if (cleanTarget.startsWith('@')) {
      cleanTarget = cleanTarget.substring(1);
    }

    const payload: Record<string, any> = {
      service: params.serviceId,
      target: cleanTarget,
      quantity: params.quantity,
    };

    if (params.customComments) payload.custom_comments = params.customComments;
    if (params.customLink) payload.custom_link = params.customLink;

    const res = await this.request<any>('order', payload);

    if (res.success && res.data) {
      const orderId = res.data.id || res.data.order_id || res.data.id_order;
      return {
        success: true,
        orderId,
        rawResponse: res.data,
      };
    }

    return {
      success: false,
      error: res.error || 'Gagal mengirim order ke MedanPedia',
      rawResponse: res.data,
    };
  }

  /**
   * Cek Status Pesanan di MedanPedia
   */
  public async checkStatus(providerOrderId: string | number): Promise<{
    success: boolean;
    status?: string;
    startCount?: number;
    remains?: number;
    rawResponse?: any;
    error?: string;
  }> {
    const payload = {
      id_order: providerOrderId,
      id: providerOrderId,
    };

    const res = await this.request<any>('status', payload);

    if (res.success && res.data) {
      const status = res.data.status || 'Processing';
      const startCount = Number(res.data.start_count ?? 0);
      const remains = Number(res.data.remains ?? 0);

      return {
        success: true,
        status,
        startCount,
        remains,
        rawResponse: res.data,
      };
    }

    return {
      success: false,
      error: res.error || `Gagal memeriksa status pesanan ID ${providerOrderId}`,
      rawResponse: res.data,
    };
  }
}

export const medanpediaService = new MedanPediaService();
