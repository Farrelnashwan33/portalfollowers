import crypto from 'crypto';

const XENDIT_API_URL = 'https://api.xendit.co';

export interface CreateInvoiceParams {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  customerName?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  currency?: string;
}

export interface XenditInvoiceResponse {
  id: string;
  external_id: string;
  user_id?: string;
  status: 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED';
  merchant_name: string;
  amount: number;
  payer_email: string;
  description: string;
  invoice_url: string;
  expiry_date: string;
  payment_method?: string;
  payment_channel?: string;
  payment_destination?: string;
  created?: string;
  updated?: string;
}

class XenditService {
  private get secretKey(): string {
    return process.env.XENDIT_SECRET_KEY || '';
  }

  private get webhookToken(): string {
    return process.env.XENDIT_WEBHOOK_TOKEN || '';
  }

  public get isConfigured(): boolean {
    return Boolean(this.secretKey);
  }

  public get mode(): 'test' | 'live' {
    return (process.env.XENDIT_MODE || 'test').toLowerCase() === 'live' ? 'live' : 'test';
  }

  private getAuthHeader(): string {
    const encoded = Buffer.from(`${this.secretKey}:`).toString('base64');
    return `Basic ${encoded}`;
  }

  /**
   * Create an official Xendit Invoice (QRIS, VA, E-Wallet, Card)
   */
  public async createInvoice(params: CreateInvoiceParams): Promise<{ success: boolean; data?: XenditInvoiceResponse; error?: string }> {
    if (!this.isConfigured) {
      console.warn('⚠️ XENDIT_SECRET_KEY is not configured. Simulating mock test invoice.');
      return {
        success: true,
        data: {
          id: `xendit_inv_mock_${Date.now()}`,
          external_id: params.externalId,
          status: 'PENDING',
          merchant_name: 'PortalFollowers (Test Mode)',
          amount: params.amount,
          payer_email: params.payerEmail,
          description: params.description,
          invoice_url: `https://checkout-staging.xendit.co/web/${params.externalId}`,
          expiry_date: new Date(Date.now() + 86400000).toISOString(),
        },
      };
    }

    try {
      const response = await fetch(`${XENDIT_API_URL}/v2/invoices`, {
        method: 'POST',
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          external_id: params.externalId,
          amount: params.amount,
          payer_email: params.payerEmail,
          description: params.description,
          customer: params.customerName
            ? {
                given_names: params.customerName,
                email: params.payerEmail,
              }
            : undefined,
          success_redirect_url: params.successRedirectUrl,
          failure_redirect_url: params.failureRedirectUrl,
          currency: params.currency || 'IDR',
          invoice_duration: 86400, // 24 hours
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        console.error('Xendit create invoice error:', json);
        return {
          success: false,
          error: json.message || json.error_code || 'Gagal membuat transaksi di Xendit.',
        };
      }

      return {
        success: true,
        data: json as XenditInvoiceResponse,
      };
    } catch (error: any) {
      console.error('Xendit service exception:', error);
      return {
        success: false,
        error: error.message || 'Koneksi ke gateway Xendit gagal.',
      };
    }
  }

  /**
   * Retrieve invoice status from Xendit by invoiceId
   */
  public async getInvoice(invoiceId: string): Promise<{ success: boolean; data?: XenditInvoiceResponse; error?: string }> {
    if (!this.isConfigured) {
      return {
        success: true,
        data: {
          id: invoiceId,
          external_id: 'PF-MOCK',
          status: 'PENDING',
          merchant_name: 'PortalFollowers',
          amount: 50000,
          payer_email: 'customer@example.com',
          description: 'Mock invoice',
          invoice_url: `https://checkout-staging.xendit.co/web/${invoiceId}`,
          expiry_date: new Date().toISOString(),
        },
      };
    }

    try {
      const response = await fetch(`${XENDIT_API_URL}/v2/invoices/${invoiceId}`, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
        },
      });

      const json = await response.json();
      if (!response.ok) {
        return { success: false, error: json.message || 'Invoice tidak ditemukan di Xendit.' };
      }

      return { success: true, data: json as XenditInvoiceResponse };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal memeriksa invoice Xendit.' };
    }
  }

  /**
   * Verify Webhook Token (x-callback-token)
   */
  public verifyWebhookToken(incomingToken: string | null): boolean {
    if (!this.webhookToken) {
      // In test mode without webhook token configured, allow for testing
      return true;
    }
    return incomingToken === this.webhookToken;
  }
}

export const xenditService = new XenditService();
