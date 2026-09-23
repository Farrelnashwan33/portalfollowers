<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { formatCurrency, formatNumber, formatDate } from '$utils/formatters';
  import { toast } from '$stores/toastStore';
  import Skeleton from '$components/Skeleton.svelte';
  import OrderTimeline from '$components/OrderTimeline.svelte';
  import {
    Search,
    Instagram,
    PackageCheck,
    Clock,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    Copy,
    Check,
    CreditCard,
    ArrowRight,
    ShieldCheck
  } from 'lucide-svelte';

  let orderCodeInput = '';
  let loading = false;
  let orderData: any = null;
  let searched = false;
  let copied = false;

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  onMount(() => {
    const queryCode = $page.url.searchParams.get('code');
    if (queryCode) {
      orderCodeInput = queryCode.trim();
      handleSearch();
    }
  });

  async function handleSearch() {
    const trimmed = orderCodeInput.trim();
    if (!trimmed) {
      toast.error('Silakan masukkan ID Pesanan (contoh: PF-20260923-XXXXXX).');
      return;
    }

    loading = true;
    searched = true;
    orderData = null;

    try {
      const res = await fetch(`${API_BASE}/api/orders/track/${encodeURIComponent(trimmed)}`);
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        orderData = json.data;
      } else {
        toast.error(json.error || 'Pesanan tidak ditemukan.');
      }
    } catch (e) {
      toast.error('Gagal menghubungi server pelacakan.');
    } finally {
      loading = false;
    }
  }

  function copyOrderCode() {
    if (!orderData) return;
    navigator.clipboard.writeText(orderData.order_code);
    copied = true;
    toast.success('ID Pesanan disalin ke clipboard!');
    setTimeout(() => (copied = false), 2000);
  }
</script>

<svelte:head>
  <title>Cek Pesanan & Live Tracking - PortalFollowers</title>
</svelte:head>

<div class="tracking-page">
  <div class="container">
    <!-- Header Hero -->
    <div class="tracking-header animate-fade-in">
      <div class="badge badge-glow" style="margin-bottom: 0.75rem;">
        <Search size={13} color="#ec4899" />
        <span>Live Status Tracking</span>
      </div>
      <h1 class="tracking-title">
        Lacak Status <span class="text-gradient">Pesanan Anda</span>
      </h1>
      <p class="tracking-sub">
        Pantau proses pengiriman followers Instagram secara realtime tanpa perlu login
      </p>

      <!-- Search Box Form -->
      <form on:submit|preventDefault={handleSearch} class="search-form glass-card">
        <div class="search-input-wrap">
          <Search size={20} class="search-icon" />
          <input
            type="text"
            placeholder="Masukkan ID Pesanan (contoh: PF-20260923-XXXXXX)"
            bind:value={orderCodeInput}
            class="search-text-input"
            required
          />
        </div>
        <button type="submit" class="btn btn-primary track-btn" disabled={loading}>
          {#if loading}
            <span class="spinner"></span>
            <span>Mencari...</span>
          {:else}
            <span>Cek Status</span>
            <ArrowRight size={16} />
          {/if}
        </button>
      </form>
    </div>

    <!-- Result Area -->
    {#if loading}
      <div class="result-card glass-panel animate-fade-in" style="margin-top: 2rem;">
        <Skeleton height="60px" count={3} />
      </div>
    {:else if orderData}
      <div class="result-card glass-panel animate-fade-in">
        <!-- Order Header Bar -->
        <div class="order-top-bar">
          <div>
            <span class="label-sub">Nomor ID Pesanan</span>
            <div class="order-code-row">
              <h2 class="order-code-text">{orderData.order_code}</h2>
              <button class="copy-btn" on:click={copyOrderCode} title="Salin ID">
                {#if copied}
                  <Check size={16} color="#10b981" />
                {:else}
                  <Copy size={16} />
                {/if}
              </button>
            </div>
          </div>

          <div class="status-badges-group">
            <div class="status-item">
              <span class="status-label">Pembayaran</span>
              {#if orderData.payment_status === 'PAID'}
                <span class="badge badge-success">Lunas</span>
              {:else if orderData.payment_status === 'PENDING_PAYMENT'}
                <span class="badge badge-warning">Menunggu Pembayaran</span>
              {:else if orderData.payment_status === 'EXPIRED'}
                <span class="badge badge-warning">Kedaluwarsa</span>
              {:else}
                <span class="badge badge-warning">{orderData.payment_status}</span>
              {/if}
            </div>

            <div class="status-item">
              <span class="status-label">Status Layanan</span>
              {#if orderData.service_status === 'COMPLETED'}
                <span class="badge badge-success">Selesai 100%</span>
              {:else if orderData.service_status === 'PROCESSING' || orderData.service_status === 'WAITING_FOR_FULFILLMENT'}
                <span class="badge badge-info">Sedang Diproses</span>
              {:else if orderData.service_status === 'PARTIALLY_COMPLETED'}
                <span class="badge badge-info">Sebagian Selesai</span>
              {:else if orderData.service_status === 'FAILED'}
                <span class="badge badge-warning">Gagal / Dibatalkan</span>
              {:else}
                <span class="badge badge-warning">Menunggu Pembayaran</span>
              {/if}
            </div>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="details-grid">
          <div class="detail-box">
            <span class="detail-lbl">Target Instagram</span>
            <div class="ig-user-row">
              <Instagram size={18} color="#ec4899" />
              <span class="ig-user-name">@{orderData.instagram_username}</span>
            </div>
          </div>

          <div class="detail-box">
            <span class="detail-lbl">Paket & Kategori</span>
            <div class="pkg-name-val">
              <span>{orderData.packages?.name || 'Instagram Followers'}</span>
              {#if orderData.packages?.category}
                <span class="category-chip">{orderData.packages.category}</span>
              {/if}
            </div>
          </div>

          <div class="detail-box">
            <span class="detail-lbl">Jumlah Followers</span>
            <span class="detail-val font-bold text-gradient">+{formatNumber(orderData.followers_amount)} Followers</span>
          </div>

          <div class="detail-box">
            <span class="detail-lbl">Total Tagihan</span>
            <span class="detail-val font-bold">{formatCurrency(orderData.price)}</span>
          </div>

          <div class="detail-box">
            <span class="detail-lbl">Waktu Pemesanan</span>
            <span class="detail-val">{formatDate(orderData.created_at)}</span>
          </div>

          <div class="detail-box">
            <span class="detail-lbl">Estimasi Pemrosesan</span>
            <span class="detail-val">{orderData.packages?.estimated_time || '1–5 Menit'}</span>
          </div>
        </div>

        <!-- Action Button for Unpaid Orders -->
        {#if orderData.payment_status === 'PENDING_PAYMENT' && orderData.xendit_payment_url}
          <div class="payment-action-banner">
            <div>
              <h4 class="pay-banner-title">Selesaikan Pembayaran Sekarang</h4>
              <p class="pay-banner-sub">Layanan akan otomatis dialokasikan ke sistem fulfillment setelah pembayaran terverifikasi.</p>
            </div>
            <a href={orderData.xendit_payment_url} target="_blank" rel="noopener noreferrer" class="btn btn-primary">
              <CreditCard size={16} />
              <span>Bayar Sekarang (Xendit)</span>
              <ExternalLink size={14} />
            </a>
          </div>
        {/if}

        <!-- Status History Timeline -->
        {#if orderData.order_status_history && orderData.order_status_history.length > 0}
          <div class="timeline-wrap">
            <h3 class="timeline-title">Riwayat Perjalanan Pesanan</h3>
            <OrderTimeline
              paymentStatus={orderData.payment_status}
              serviceStatus={orderData.status || orderData.service_status}
              history={orderData.order_status_history}
            />
          </div>
        {/if}
      </div>
    {:else if searched}
      <div class="empty-result glass-panel animate-fade-in">
        <AlertCircle size={44} color="#f59e0b" />
        <h3>Pesanan Tidak Ditemukan</h3>
        <p>Pastikan kode pesanan yang Anda masukkan sudah benar (contoh: <code>PF-20260923-XXXXXX</code>) dan tidak ada spasi berlebih.</p>
        <a href="/packages" class="btn btn-primary" style="margin-top: 1rem;">
          <span>Pesan Followers Sekarang</span>
        </a>
      </div>
    {/if}
  </div>
</div>

<style>
  .tracking-page {
    padding: 4rem 0 6rem;
    min-height: calc(100vh - 200px);
  }

  .tracking-header {
    text-align: center;
    max-width: 680px;
    margin: 0 auto 3rem;
  }

  .tracking-title {
    font-size: 2.25rem;
    color: #ffffff;
    margin-bottom: 0.5rem;
  }

  .tracking-sub {
    font-size: 0.95rem;
    color: var(--text-secondary);
    margin-bottom: 2rem;
  }

  .search-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: var(--radius-xl);
    border: 1px solid var(--border-glow);
  }

  @media (min-width: 640px) {
    .search-form {
      flex-direction: row;
    }
  }

  .search-input-wrap {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    padding: 0.6rem 1rem;
    background: rgba(10, 14, 22, 0.6);
    border-radius: var(--radius-lg);
  }

  :global(.search-icon) {
    color: var(--text-muted);
  }

  .search-text-input {
    background: transparent;
    border: none;
    outline: none;
    color: #ffffff;
    font-size: 0.95rem;
    width: 100%;
    font-family: var(--font-display);
    letter-spacing: 0.02em;
  }

  .track-btn {
    white-space: nowrap;
    padding: 0.85rem 1.75rem;
  }

  .result-card {
    max-width: 840px;
    margin: 2.5rem auto 0;
    padding: 2.5rem 2rem;
    border-radius: var(--radius-2xl);
  }

  .order-top-bar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 1.75rem;
    border-bottom: 1px solid var(--border-subtle);
  }

  @media (min-width: 640px) {
    .order-top-bar {
      flex-direction: row;
      align-items: center;
    }
  }

  .label-sub {
    font-size: 0.78rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .order-code-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .order-code-text {
    font-size: 1.65rem;
    color: #ffffff;
    font-family: var(--font-display);
  }

  .copy-btn {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--border-subtle);
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
    padding: 0.35rem 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: all 0.2s;
  }

  .copy-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.12);
  }

  .status-badges-group {
    display: flex;
    gap: 1.25rem;
  }

  .status-item {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .status-label {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 600;
  }

  .details-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    margin: 2rem 0;
  }

  @media (min-width: 640px) {
    .details-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 768px) {
    .details-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .detail-box {
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid var(--border-subtle);
    padding: 1.15rem;
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .detail-lbl {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .detail-val {
    font-size: 0.95rem;
    color: #ffffff;
  }

  .ig-user-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .ig-user-name {
    font-weight: 700;
    color: #f472b6;
    font-size: 1rem;
  }

  .pkg-name-val {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: #ffffff;
  }

  .category-chip {
    background: rgba(236, 72, 153, 0.15);
    color: #f472b6;
    font-size: 0.68rem;
    padding: 0.15rem 0.45rem;
    border-radius: var(--radius-sm);
    font-weight: 700;
  }

  .payment-action-banner {
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(249, 115, 22, 0.15));
    border: 1px solid rgba(236, 72, 153, 0.35);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
  }

  @media (min-width: 640px) {
    .payment-action-banner {
      flex-direction: row;
      align-items: center;
    }
  }

  .pay-banner-title {
    font-size: 1.1rem;
    color: #ffffff;
    margin-bottom: 0.2rem;
  }

  .pay-banner-sub {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .timeline-wrap {
    padding-top: 1.75rem;
    border-top: 1px solid var(--border-subtle);
  }

  .timeline-title {
    font-size: 1.15rem;
    color: #ffffff;
    margin-bottom: 1.25rem;
  }

  .empty-result {
    max-width: 600px;
    margin: 3rem auto 0;
    text-align: center;
    padding: 3.5rem 2rem;
    border-radius: var(--radius-2xl);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
  }

  .empty-result h3 {
    font-size: 1.35rem;
    color: #ffffff;
  }

  .empty-result p {
    font-size: 0.9rem;
    color: var(--text-secondary);
    max-width: 440px;
  }

  .empty-result code {
    background: rgba(255, 255, 255, 0.08);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    color: #f472b6;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
