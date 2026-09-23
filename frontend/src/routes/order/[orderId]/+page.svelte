<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import type { Order } from '$types';
  import { getOrder, updateOrderStatus } from '$services/api';
  import { formatCurrency, formatNumber, formatDate } from '$utils/formatters';
  import { toast } from '$stores/toastStore';
  import OrderTimeline from '$components/OrderTimeline.svelte';
  import Skeleton from '$components/Skeleton.svelte';
  import confetti from 'canvas-confetti';
  import {
    Instagram,
    Copy,
    Check,
    RefreshCw,
    ExternalLink,
    ShieldCheck,
    Clock,
    CreditCard,
    Zap,
    QrCode,
    AlertCircle,
    ArrowLeft,
    CheckCircle2
  } from 'lucide-svelte';

  let orderId = '';
  let order: Order | null = null;
  let loading = true;
  let copied = false;
  let simulatingPayment = false;
  let pollInterval: any = null;

  $: orderId = $page.params.orderId || '';

  async function loadOrder(isBackground = false) {
    if (!orderId) return;
    if (!isBackground) loading = true;
    try {
      const res = await getOrder(orderId);
      if (res.success && res.data) {
        const prevStatus = order?.service_status;
        order = res.data;

        // Trigger confetti when newly completed
        if (order.service_status === 'completed' && prevStatus !== 'completed') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } else {
        if (!isBackground) toast.error(res.error || 'Pesanan tidak ditemukan.');
      }
    } catch (e) {
      if (!isBackground) toast.error('Gagal memuat status pesanan.');
    } finally {
      if (!isBackground) loading = false;
    }
  }

  onMount(() => {
    loadOrder();

    // Auto-poll status every 10 seconds
    pollInterval = setInterval(() => {
      if (order && (order.payment_status === 'pending' || order.service_status === 'processing')) {
        loadOrder(true);
      }
    }, 10000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  });

  function copyOrderCode() {
    if (!order) return;
    navigator.clipboard.writeText(order.order_code);
    copied = true;
    toast.success('Nomor pesanan berhasil disalin!');
    setTimeout(() => {
      copied = false;
    }, 2500);
  }

  // Simulation handler for quick test/demo
  async function simulatePaymentSuccess() {
    if (!order) return;
    simulatingPayment = true;
    try {
      const res = await updateOrderStatus(order.id, {
        paymentStatus: 'paid',
        serviceStatus: 'processing',
        adminNote: 'Pembayaran otomatis terverifikasi via QRIS Simulator.',
      });

      if (res.success && res.data) {
        order = res.data;
        toast.success('Simulasi pembayaran berhasil! Status kini SEDANG DIPROSES.');
      } else {
        toast.error('Gagal memperbarui status simulasi.');
      }
    } catch (e) {
      toast.error('Terjadi kendala saat simulasi.');
    } finally {
      simulatingPayment = false;
    }
  }

  async function simulateCompleteOrder() {
    if (!order) return;
    simulatingPayment = true;
    try {
      const res = await updateOrderStatus(order.id, {
        paymentStatus: 'paid',
        serviceStatus: 'completed',
        adminNote: 'Pengiriman followers selesai secara penuh.',
      });

      if (res.success && res.data) {
        order = res.data;
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
        toast.success('Pesanan telah berhasil diselesaikan 100%!');
      }
    } finally {
      simulatingPayment = false;
    }
  }
</script>

<svelte:head>
  <title>Status Pesanan #{orderId} - Portal Followers</title>
</svelte:head>

<div class="order-detail-page">
  <div class="container">
    <div class="page-nav">
      <a href="/" class="btn-back">
        <ArrowLeft size={16} />
        <span>Kembali ke Beranda</span>
      </a>
      <button class="btn btn-secondary btn-sm" on:click={() => loadOrder(false)}>
        <RefreshCw size={14} />
        <span>Refresh Status</span>
      </button>
    </div>

    {#if loading}
      <div class="loading-box glass-panel">
        <Skeleton height="35px" width="50%" />
        <Skeleton height="20px" width="30%" />
        <div style="margin: 2rem 0;">
          <Skeleton height="120px" width="100%" />
        </div>
        <Skeleton height="200px" width="100%" />
      </div>
    {:else if !order}
      <div class="not-found-card glass-panel">
        <AlertCircle size={48} color="#f43f5e" />
        <h2>Pesanan Tidak Ditemukan</h2>
        <p>Pastikan ID Pesanan <strong>"{orderId}"</strong> sudah sesuai dan tidak ada kesalahan penulisan.</p>
        <a href="/" class="btn btn-primary">Pesan Followers Sekarang</a>
      </div>
    {:else}
      <div class="order-layout">
        <!-- Main Details Column -->
        <div class="order-main-col">
          <!-- Top Header Card -->
          <div class="glass-panel order-card">
            <div class="order-header-row">
              <div class="order-code-group">
                <span class="order-label">ID Pesanan</span>
                <div class="code-copy-box">
                  <h1 class="order-code-text">{order.order_code}</h1>
                  <button class="copy-btn" on:click={copyOrderCode} title="Salin Kode Pesanan">
                    {#if copied}
                      <Check size={16} color="#10b981" />
                    {:else}
                      <Copy size={16} />
                    {/if}
                  </button>
                </div>
              </div>

              <div class="status-badge-group">
                {#if order.service_status === 'completed'}
                  <span class="badge badge-success">
                    <CheckCircle2 size={13} />
                    Selesai
                  </span>
                {:else if order.service_status === 'processing'}
                  <span class="badge badge-info">
                    <Zap size={13} />
                    Sedang Diproses
                  </span>
                {:else if order.payment_status === 'paid'}
                  <span class="badge badge-success">
                    <Check size={13} />
                    Pembayaran Lunas
                  </span>
                {:else if order.payment_status === 'failed' || order.service_status === 'failed'}
                  <span class="badge badge-warning">
                    <AlertCircle size={13} />
                    Gagal / Batal
                  </span>
                {:else}
                  <span class="badge badge-warning">
                    <Clock size={13} />
                    Menunggu Pembayaran
                  </span>
                {/if}
              </div>
            </div>

            <div class="meta-date-row">
              <span class="meta-date">Waktu Pemesanan: {formatDate(order.created_at)}</span>
            </div>

            <hr class="card-divider" />

            <!-- Visual Progress Timeline -->
            <div class="timeline-container">
              <OrderTimeline
                paymentStatus={order.payment_status}
                serviceStatus={order.service_status}
              />
            </div>
          </div>

          <!-- Target & Service Information -->
          <div class="glass-panel order-card">
            <h3 class="card-section-title">Detail Layanan Target</h3>
            <div class="target-grid">
              <div class="target-item">
                <span class="target-label">Target Akun Instagram</span>
                <div class="ig-user-box">
                  <div class="ig-avatar-badge">
                    <Instagram size={18} color="#ffffff" />
                  </div>
                  <div class="ig-info">
                    <span class="ig-username">@{order.instagram_username}</span>
                    <a
                      href="https://www.instagram.com/{order.instagram_username}/"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="ig-link"
                    >
                      Buka Profil Instagram <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>

              <div class="target-item">
                <span class="target-label">Paket Dipilih</span>
                <p class="target-value">
                  {order.packages?.name || 'Paket Followers'} ({formatNumber(order.followers_amount)} Followers)
                </p>
                <span class="target-sub">Estimasi: {order.packages?.estimated_time || '1-24 Jam'}</span>
              </div>

              <div class="target-item">
                <span class="target-label">Nama Pemesan</span>
                <p class="target-value">{order.customer_name}</p>
                <span class="target-sub">{order.customer_email}</span>
              </div>

              <div class="target-item">
                <span class="target-label">Metode Pembayaran</span>
                <p class="target-value uppercase">{order.payment_method}</p>
                <span class="target-sub">
                  Status: <strong class="capitalize">{order.payment_status}</strong>
                </span>
              </div>
            </div>

            {#if order.customer_note}
              <div class="note-box">
                <span class="note-label">Catatan Pemesan:</span>
                <p class="note-text">{order.customer_note}</p>
              </div>
            {/if}

            {#if order.admin_note}
              <div class="note-box admin-note-box">
                <span class="note-label">Catatan Status / Sistem:</span>
                <p class="note-text">{order.admin_note}</p>
              </div>
            {/if}
          </div>

          <!-- Status History Log -->
          {#if order.order_status_history && order.order_status_history.length > 0}
            <div class="glass-panel order-card">
              <h3 class="card-section-title">Riwayat Aktivitas Pesanan</h3>
              <div class="history-list">
                {#each order.order_status_history as hist}
                  <div class="history-item">
                    <div class="history-dot"></div>
                    <div class="history-body">
                      <div class="history-header">
                        <span class="history-status uppercase">{hist.status}</span>
                        <span class="history-time">{formatDate(hist.created_at)}</span>
                      </div>
                      <p class="history-note">{hist.note || 'Status pesanan diperbarui.'}</p>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- Sidebar / Payment Column -->
        <div class="order-side-col">
          <!-- Payment Box (If Pending) -->
          {#if order.payment_status === 'pending'}
            <div class="glass-panel payment-card">
              <div class="payment-header">
                <QrCode size={22} color="#ec4899" />
                <h3 class="payment-title">Instruksi Pembayaran</h3>
              </div>
              <p class="payment-sub">Scan QRIS berikut menggunakan BCA Mobile, Livin, GoPay, OVO, atau DANA:</p>

              <!-- QRIS Simulator Mock -->
              <div class="qris-box">
                <div class="qris-badge-top">QRIS STANDAR PEMBAYARAN NASIONAL</div>
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=PORTAL_FOLLOWERS_{order.order_code}_{order.price}"
                  alt="QRIS Code"
                  class="qris-img"
                />
                <span class="qris-brand">PORTAL FOLLOWERS MERCHANT</span>
              </div>

              <div class="payment-amount-box">
                <span class="amount-label">Total Tagihan:</span>
                <span class="amount-value text-gradient">{formatCurrency(order.price)}</span>
              </div>

              <!-- Dev / Testing Simulation Buttons -->
              <div class="simulation-group">
                <p class="simulation-title">⚡ Testing / Quick Actions:</p>
                <button
                  class="btn btn-primary w-full"
                  on:click={simulatePaymentSuccess}
                  disabled={simulatingPayment}
                >
                  <Zap size={16} />
                  <span>{simulatingPayment ? 'Memproses...' : 'Simulasikan Pembayaran Sukses'}</span>
                </button>
              </div>
            </div>
          {:else if order.service_status === 'processing'}
            <div class="glass-panel payment-card success-side-card">
              <div class="side-icon-box">
                <Zap size={24} color="#06b6d4" />
              </div>
              <h3 class="side-title">Sedang Diproses</h3>
              <p class="side-desc">
                Followers sedang dialokasikan secara bertahap ke akun <strong>@{order.instagram_username}</strong>.
              </p>
              <div class="simulation-group" style="margin-top: 1rem;">
                <button
                  class="btn btn-secondary w-full"
                  on:click={simulateCompleteOrder}
                  disabled={simulatingPayment}
                >
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Simulasikan Pesanan Selesai</span>
                </button>
              </div>
            </div>
          {:else if order.service_status === 'completed'}
            <div class="glass-panel payment-card completed-side-card">
              <div class="side-icon-box completed-icon">
                <CheckCircle2 size={28} color="#10b981" />
              </div>
              <h3 class="side-title">Pesanan Selesai!</h3>
              <p class="side-desc">
                Seluruh <strong>{formatNumber(order.followers_amount)} followers</strong> telah sukses dikirim ke profil Anda.
              </p>
              <div class="guarantee-pill">
                <ShieldCheck size={16} color="#10b981" />
                <span>Garansi Refill Aktif 30 Hari</span>
              </div>
            </div>
          {/if}

          <!-- Security Assurance Card -->
          <div class="glass-card assurance-card">
            <div class="assurance-item">
              <ShieldCheck size={18} color="#10b981" />
              <div>
                <h5>Garansi Isi Ulang (Refill)</h5>
                <p>Jika terjadi penurunan alami dalam 30 hari, kami isi ulang gratis.</p>
              </div>
            </div>
            <div class="assurance-item">
              <Zap size={18} color="#f59e0b" />
              <div>
                <h5>Bantuan Cepat 24/7</h5>
                <p>Ada kendala dengan pesanan Anda? Hubungi tim support kapan saja.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .order-detail-page {
    padding: 3rem 0 6rem;
  }

  .page-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-weight: 500;
    transition: color 0.2s;
  }

  .btn-back:hover {
    color: #ffffff;
  }

  .loading-box,
  .not-found-card {
    padding: 3.5rem 2rem;
    text-align: center;
    border-radius: var(--radius-xl);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
  }

  .order-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  @media (min-width: 1024px) {
    .order-layout {
      grid-template-columns: 1.6fr 1fr;
      gap: 2.5rem;
    }
  }

  .order-card {
    padding: 2rem;
    margin-bottom: 2rem;
    border-radius: var(--radius-xl);
  }

  .order-header-row {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: space-between;
  }

  @media (min-width: 640px) {
    .order-header-row {
      flex-direction: row;
      align-items: flex-start;
    }
  }

  .order-label {
    font-size: 0.8rem;
    color: var(--text-muted);
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .code-copy-box {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.25rem;
  }

  .order-code-text {
    font-size: 1.75rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.01em;
  }

  .copy-btn {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--border-subtle);
    color: var(--text-secondary);
    padding: 0.45rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .copy-btn:hover {
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.2);
  }

  .meta-date-row {
    margin-top: 0.5rem;
  }

  .meta-date {
    font-size: 0.82rem;
    color: var(--text-muted);
  }

  .card-divider {
    border: none;
    border-top: 1px solid var(--border-subtle);
    margin: 1.5rem 0;
  }

  .card-section-title {
    font-size: 1.15rem;
    color: #ffffff;
    margin-bottom: 1.5rem;
  }

  .target-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 640px) {
    .target-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .target-item {
    display: flex;
    flex-direction: column;
  }

  .target-label {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 0.35rem;
  }

  .ig-user-box {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .ig-avatar-badge {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--gradient-ig);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ig-info {
    display: flex;
    flex-direction: column;
  }

  .ig-username {
    font-weight: 700;
    color: #ffffff;
    font-size: 0.95rem;
  }

  .ig-link {
    font-size: 0.75rem;
    color: var(--ig-pink);
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }

  .target-value {
    font-weight: 600;
    color: #ffffff;
    font-size: 0.95rem;
  }

  .target-sub {
    font-size: 0.78rem;
    color: var(--text-secondary);
  }

  .uppercase {
    text-transform: uppercase;
  }

  .capitalize {
    text-transform: capitalize;
  }

  .note-box {
    margin-top: 1.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 1rem;
  }

  .admin-note-box {
    border-color: rgba(6, 182, 212, 0.3);
    background: rgba(6, 182, 212, 0.05);
  }

  .note-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 600;
    display: block;
    margin-bottom: 0.25rem;
  }

  .note-text {
    font-size: 0.88rem;
    color: var(--text-primary);
  }

  /* History list */
  .history-list {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    position: relative;
    padding-left: 0.5rem;
  }

  .history-item {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .history-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--ig-pink);
    margin-top: 0.35rem;
    flex-shrink: 0;
    box-shadow: 0 0 8px var(--ig-pink);
  }

  .history-body {
    flex: 1;
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.2rem;
  }

  .history-status {
    font-size: 0.8rem;
    font-weight: 700;
    color: #ffffff;
  }

  .history-time {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .history-note {
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  /* Sidebar payment */
  .payment-card {
    padding: 2rem;
    border-radius: var(--radius-xl);
    margin-bottom: 1.5rem;
  }

  .payment-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.4rem;
  }

  .payment-title {
    font-size: 1.2rem;
    color: #ffffff;
  }

  .payment-sub {
    font-size: 0.82rem;
    color: var(--text-secondary);
    margin-bottom: 1.25rem;
  }

  .qris-box {
    background: #ffffff;
    color: #000000;
    border-radius: var(--radius-md);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  }

  .qris-badge-top {
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    color: #1e293b;
  }

  .qris-img {
    width: 190px;
    height: 190px;
  }

  .qris-brand {
    font-size: 0.75rem;
    font-weight: 700;
    color: #475569;
  }

  .payment-amount-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 0.85rem 1rem;
    margin-bottom: 1.5rem;
  }

  .amount-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .amount-value {
    font-size: 1.25rem;
    font-weight: 800;
    font-family: var(--font-display);
  }

  .simulation-group {
    background: rgba(245, 158, 11, 0.06);
    border: 1px dashed rgba(245, 158, 11, 0.3);
    border-radius: var(--radius-md);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .simulation-title {
    font-size: 0.78rem;
    color: #fbbf24;
    font-weight: 600;
  }

  .side-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(6, 182, 212, 0.12);
    border: 1px solid rgba(6, 182, 212, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .completed-icon {
    background: rgba(16, 185, 129, 0.12);
    border-color: rgba(16, 185, 129, 0.3);
  }

  .side-title {
    font-size: 1.25rem;
    color: #ffffff;
    margin-bottom: 0.4rem;
  }

  .side-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .guarantee-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.25);
    padding: 0.4rem 0.85rem;
    border-radius: var(--radius-full);
    font-size: 0.8rem;
    color: #34d399;
    font-weight: 600;
    margin-top: 1rem;
  }

  .assurance-card {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .assurance-item {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .assurance-item h5 {
    font-size: 0.88rem;
    color: #ffffff;
    margin-bottom: 0.15rem;
  }

  .assurance-item p {
    font-size: 0.78rem;
    color: var(--text-muted);
    line-height: 1.4;
  }

  .w-full {
    width: 100%;
  }
</style>
