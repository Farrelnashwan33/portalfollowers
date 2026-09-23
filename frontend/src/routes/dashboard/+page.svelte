<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$stores/authStore';
  import type { Order, Package } from '$types';
  import { fetchPackages, fetchUserOrders } from '$services/api';
  import { formatCurrency, formatNumber, formatDate } from '$utils/formatters';
  import OrderModal from '$components/OrderModal.svelte';
  import Skeleton from '$components/Skeleton.svelte';
  import {
    LayoutDashboard,
    PackageCheck,
    Clock,
    CheckCircle2,
    Instagram,
    Plus,
    ExternalLink,
    Search,
    User,
    Shield,
    AlertCircle,
    Zap
  } from 'lucide-svelte';

  let orders: Order[] = [];
  let packages: Package[] = [];
  let loading = true;
  let isOrderModalOpen = false;
  let searchQuery = '';

  onMount(async () => {
    try {
      packages = await fetchPackages();
      await loadUserOrders();
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  });

  async function loadUserOrders() {
    if ($auth.user) {
      const userOrders = await fetchUserOrders($auth.user.id);
      if (userOrders && userOrders.length > 0) {
        orders = userOrders;
        return;
      }
    }
    // Also try fetch general user orders
    const fetched = await fetchUserOrders();
    orders = fetched || [];
  }

  $: totalOrders = orders.length;
  $: activeOrders = orders.filter((o) => o.service_status === 'pending' || o.service_status === 'processing').length;
  $: completedOrders = orders.filter((o) => o.service_status === 'completed').length;

  $: filteredOrders = orders.filter(
    (o) =>
      o.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.instagram_username.toLowerCase().includes(searchQuery.toLowerCase())
  );
</script>

<svelte:head>
  <title>Dashboard Pengguna - Portal Followers</title>
</svelte:head>

<div class="dashboard-page">
  <div class="container">
    <!-- Header with Welcome -->
    <div class="dashboard-header">
      <div>
        <div class="badge badge-glow" style="margin-bottom: 0.5rem;">
          <LayoutDashboard size={12} />
          <span>Dashboard Pengguna</span>
        </div>
        <h1 class="dash-title">
          Halo, <span class="text-gradient">{$auth.profile?.full_name || $auth.user?.email || 'Pelanggan Setia'}</span> 👋
        </h1>
        <p class="dash-sub">Kelola dan pantau seluruh transaksi pertumbuhan akun Instagram Anda</p>
      </div>

      <button class="btn btn-primary" on:click={() => (isOrderModalOpen = true)}>
        <Plus size={18} />
        <span>Buat Pesanan Baru</span>
      </button>
    </div>

    <!-- Stat Metric Cards -->
    <div class="metrics-grid">
      <div class="glass-card metric-card">
        <div class="metric-icon-box" style="background: rgba(236, 72, 153, 0.12); border-color: rgba(236, 72, 153, 0.3);">
          <PackageCheck size={24} color="#ec4899" />
        </div>
        <div>
          <span class="metric-label">Total Pesanan</span>
          <h2 class="metric-val">{totalOrders}</h2>
        </div>
      </div>

      <div class="glass-card metric-card">
        <div class="metric-icon-box" style="background: rgba(245, 158, 11, 0.12); border-color: rgba(245, 158, 11, 0.3);">
          <Clock size={24} color="#f59e0b" />
        </div>
        <div>
          <span class="metric-label">Pesanan Aktif / Proses</span>
          <h2 class="metric-val">{activeOrders}</h2>
        </div>
      </div>

      <div class="glass-card metric-card">
        <div class="metric-icon-box" style="background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.3);">
          <CheckCircle2 size={24} color="#10b981" />
        </div>
        <div>
          <span class="metric-label">Pesanan Sukses Selesai</span>
          <h2 class="metric-val">{completedOrders}</h2>
        </div>
      </div>
    </div>

    <!-- Order History Section -->
    <div class="orders-section glass-panel">
      <div class="section-top-bar">
        <div>
          <h3 class="orders-title">Riwayat Pesanan Saya</h3>
          <p class="orders-sub">Daftar transaksi dan progress pengiriman followers Anda</p>
        </div>

        <div class="search-box">
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Cari ID pesanan / username IG..."
            bind:value={searchQuery}
            class="search-input"
          />
        </div>
      </div>

      {#if loading}
        <div style="padding: 2rem;">
          <Skeleton height="50px" count={4} />
        </div>
      {:else if filteredOrders.length === 0}
        <div class="empty-orders">
          <Instagram size={40} color="#64748b" />
          <h4>Belum Ada Pesanan</h4>
          <p>Anda belum memiliki riwayat order followers. Mulai tingkatkan engagement akun Anda sekarang.</p>
          <button class="btn btn-primary" on:click={() => (isOrderModalOpen = true)}>
            <Plus size={16} />
            <span>Pesan Followers Pertama</span>
          </button>
        </div>
      {:else}
        <!-- Responsive Orders Table / Cards -->
        <div class="table-responsive">
          <table class="orders-table">
            <thead>
              <tr>
                <th>ID Pesanan</th>
                <th>Target Instagram</th>
                <th>Followers</th>
                <th>Total Harga</th>
                <th>Status Bayar</th>
                <th>Status Layanan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredOrders as ord}
                <tr>
                  <td>
                    <span class="code-pill">{ord.order_code}</span>
                    <span class="date-sub">{formatDate(ord.created_at)}</span>
                  </td>
                  <td>
                    <div class="ig-cell">
                      <Instagram size={14} color="#ec4899" />
                      <span>@{ord.instagram_username}</span>
                    </div>
                  </td>
                  <td>
                    <span class="followers-pill">+{formatNumber(ord.followers_amount)}</span>
                  </td>
                  <td class="font-bold">{formatCurrency(ord.price)}</td>
                  <td>
                    {#if ord.payment_status === 'paid'}
                      <span class="badge badge-success">Lunas</span>
                    {:else if ord.payment_status === 'pending'}
                      <span class="badge badge-warning">Pending</span>
                    {:else}
                      <span class="badge badge-warning">{ord.payment_status}</span>
                    {/if}
                  </td>
                  <td>
                    {#if ord.service_status === 'completed'}
                      <span class="badge badge-success">Selesai</span>
                    {:else if ord.service_status === 'processing'}
                      <span class="badge badge-info">Diproses</span>
                    {:else if ord.service_status === 'failed'}
                      <span class="badge badge-warning">Gagal</span>
                    {:else}
                      <span class="badge badge-warning">Menunggu</span>
                    {/if}
                  </td>
                  <td>
                    <a href="/order/{ord.order_code}" class="btn btn-secondary btn-sm table-btn">
                      <span>Lacak / Invoice</span>
                      <ExternalLink size={13} />
                    </a>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>

<OrderModal
  isOpen={isOrderModalOpen}
  {packages}
  selectedPackage={packages[0] || null}
  onClose={() => {
    isOrderModalOpen = false;
    loadUserOrders();
  }}
/>

<style>
  .dashboard-page {
    padding: 3.5rem 0 6rem;
  }

  .dashboard-header {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2.5rem;
  }

  @media (min-width: 768px) {
    .dashboard-header {
      flex-direction: row;
      align-items: center;
    }
  }

  .dash-title {
    font-size: 2rem;
    color: #ffffff;
    margin-bottom: 0.35rem;
  }

  .dash-sub {
    font-size: 0.92rem;
    color: var(--text-secondary);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    margin-bottom: 2.5rem;
  }

  @media (min-width: 640px) {
    .metrics-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .metric-card {
    padding: 1.75rem;
    display: flex;
    align-items: center;
    gap: 1.25rem;
    border-radius: var(--radius-lg);
  }

  .metric-icon-box {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    border: 1px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .metric-label {
    font-size: 0.82rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .metric-val {
    font-size: 1.85rem;
    font-weight: 800;
    font-family: var(--font-display);
    color: #ffffff;
  }

  /* Orders section */
  .orders-section {
    padding: 2rem;
    border-radius: var(--radius-xl);
  }

  .section-top-bar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: space-between;
    margin-bottom: 1.75rem;
  }

  @media (min-width: 768px) {
    .section-top-bar {
      flex-direction: row;
      align-items: center;
    }
  }

  .orders-title {
    font-size: 1.25rem;
    color: #ffffff;
    margin-bottom: 0.2rem;
  }

  .orders-sub {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: rgba(10, 14, 22, 0.8);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 0.55rem 0.9rem;
    min-width: 280px;
  }

  .search-input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-size: 0.88rem;
    width: 100%;
  }

  .empty-orders {
    text-align: center;
    padding: 4rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
  }

  .empty-orders h4 {
    font-size: 1.15rem;
    color: #ffffff;
  }

  .empty-orders p {
    font-size: 0.88rem;
    color: var(--text-secondary);
    max-width: 400px;
    margin-bottom: 0.5rem;
  }

  /* Responsive table */
  .table-responsive {
    overflow-x: auto;
  }

  .orders-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.9rem;
  }

  .orders-table th {
    padding: 1rem 1.25rem;
    color: var(--text-muted);
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid var(--border-subtle);
  }

  .orders-table td {
    padding: 1.15rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    vertical-align: middle;
  }

  .orders-table tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }

  .code-pill {
    font-family: var(--font-display);
    font-weight: 700;
    color: #ffffff;
    display: block;
  }

  .date-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .ig-cell {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 600;
    color: #ffffff;
  }

  .followers-pill {
    background: rgba(236, 72, 153, 0.12);
    color: #f472b6;
    padding: 0.25rem 0.6rem;
    border-radius: var(--radius-sm);
    font-size: 0.82rem;
    font-weight: 700;
  }

  .font-bold {
    font-weight: 700;
    color: #ffffff;
  }

  .table-btn {
    white-space: nowrap;
  }
</style>
