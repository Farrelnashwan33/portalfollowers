<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$stores/authStore';
  import { toast } from '$stores/toastStore';
  import type { Order, Package } from '$types';
  import {
    fetchAllPackagesAdmin,
    fetchAllOrdersAdmin,
    updateOrderStatus,
    createPackageAdmin,
    updatePackageAdmin,
    deletePackageAdmin,
    fetchAdminDashboard,
    fetchAdminCustomers,
    fetchAdminPayments,
    fetchAdminLogs,
    fetchAdminFreeOrders,
    createAdminFreeOrder,
    fetchAdminFulfillment,
    updateAdminFulfillment
  } from '$services/api';
  import { formatCurrency, formatNumber, formatDate } from '$utils/formatters';
  import Skeleton from '$components/Skeleton.svelte';
  import {
    Shield,
    Users,
    PackageCheck,
    Clock,
    CheckCircle2,
    DollarSign,
    Search,
    Filter,
    Edit,
    Plus,
    Trash2,
    X,
    ExternalLink,
    RefreshCw,
    AlertCircle,
    Instagram,
    Check,
    Zap,
    CreditCard,
    Activity,
    Gift,
    ListOrdered,
    ArrowUpRight,
    HelpCircle
  } from 'lucide-svelte';

  type TabType = 'dashboard' | 'orders' | 'packages' | 'payments' | 'customers' | 'free_orders' | 'fulfillment' | 'logs';

  let activeTab: TabType = 'orders';
  let loading = true;

  // Data lists
  let orders: Order[] = [];
  let packages: Package[] = [];
  let dashboardData: any = null;
  let customers: any[] = [];
  let paymentLogs: any[] = [];
  let webhookLogs: any[] = [];
  let adminLogs: any[] = [];
  let freeOrders: any[] = [];
  let fulfillmentTasks: any[] = [];

  // Search & Filters
  let searchQuery = '';
  let statusFilter = 'all';

  // Order Edit Modal
  let selectedOrder: any = null;
  let isEditOrderModalOpen = false;
  let editPaymentStatus = 'PENDING';
  let editServiceStatus = 'PENDING';
  let editAdminNote = '';
  let savingOrder = false;

  // Package Modal
  let isPackageModalOpen = false;
  let isEditingPackage = false;
  let currentPackageId: string | null = null;
  let pkgName = '';
  let pkgCategory = 'INDONESIA';
  let pkgFollowers = 1000;
  let pkgPrice = 79000;
  let pkgEstimatedTime = '1-5 Menit';
  let pkgBadge = '';
  let pkgDescription = '';
  let pkgIsActive = true;
  let savingPackage = false;

  // Free Order Modal / Form
  let isFreeOrderModalOpen = false;
  let freeOrderPackageId = '';
  let freeOrderUsername = '';
  let freeOrderCustomerName = 'Admin Portal';
  let freeOrderCustomerEmail = 'admin@portalfollowers.com';
  let freeOrderCustomerWhatsapp = '081234567890';
  let freeOrderNotes = 'Promo Khusus / Partner Admin';
  let savingFreeOrder = false;

  // Fulfillment Edit Modal
  let selectedFulfillment: any = null;
  let isFulfillmentModalOpen = false;
  let editFulfillmentStatus = 'PENDING';
  let editProviderOrderId = '';
  let editStartCount: number | null = null;
  let editRemains: number | null = null;
  let editFulfillmentNotes = '';
  let savingFulfillment = false;

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    try {
      const [pkgs, ords] = await Promise.all([
        fetchAllPackagesAdmin(),
        fetchAllOrdersAdmin()
      ]);
      packages = pkgs || [];
      orders = ords || [];

      // Lazy load tab specific data
      if (activeTab === 'dashboard') await loadDashboard();
      else if (activeTab === 'customers') await loadCustomers();
      else if (activeTab === 'payments') await loadPayments();
      else if (activeTab === 'free_orders') await loadFreeOrders();
      else if (activeTab === 'fulfillment') await loadFulfillment();
      else if (activeTab === 'logs') await loadLogs();
    } catch (e) {
      console.error('Error loading admin data:', e);
      toast.error('Gagal memuat data admin.');
    } finally {
      loading = false;
    }
  }

  async function switchTab(tab: TabType) {
    activeTab = tab;
    if (tab === 'dashboard' && !dashboardData) await loadDashboard();
    if (tab === 'customers' && customers.length === 0) await loadCustomers();
    if (tab === 'payments' && paymentLogs.length === 0) await loadPayments();
    if (tab === 'free_orders' && freeOrders.length === 0) await loadFreeOrders();
    if (tab === 'fulfillment' && fulfillmentTasks.length === 0) await loadFulfillment();
    if (tab === 'logs' && adminLogs.length === 0) await loadLogs();
  }

  async function loadDashboard() {
    const res = await fetchAdminDashboard();
    if (res.success) dashboardData = res.data;
  }

  async function loadCustomers() {
    const res = await fetchAdminCustomers();
    if (res.success && res.data) customers = res.data;
  }

  async function loadPayments() {
    const res = await fetchAdminPayments();
    if (res.success && res.data) {
      paymentLogs = res.data.payments || [];
      webhookLogs = res.data.webhooks || [];
    }
  }

  async function loadFreeOrders() {
    const res = await fetchAdminFreeOrders();
    if (res.success && res.data) freeOrders = res.data;
  }

  async function loadFulfillment() {
    const res = await fetchAdminFulfillment();
    if (res.success && res.data) fulfillmentTasks = res.data;
  }

  async function loadLogs() {
    const res = await fetchAdminLogs();
    if (res.success && res.data) adminLogs = res.data.logs || [];
  }

  // Calculated Stats
  $: totalOrders = orders.length;
  $: pendingOrders = orders.filter((o: any) => (o.status || o.service_status) === 'PENDING' || (o.payment_status || '').toUpperCase() === 'PENDING').length;
  $: processingOrders = orders.filter((o: any) => (o.status || o.service_status) === 'PROCESSING').length;
  $: completedOrders = orders.filter((o: any) => (o.status || o.service_status) === 'COMPLETED').length;
  $: totalRevenue = orders
    .filter((o: any) => (o.payment_status || '').toUpperCase() === 'PAID')
    .reduce((sum: number, o: any) => sum + (Number(o.amount || o.price) || 0), 0);

  // Filtered Orders
  $: filteredOrders = orders.filter((o: any) => {
    const code = o.order_code || '';
    const user = o.target_username || o.instagram_username || '';
    const name = o.customer_name || '';
    const email = o.customer_email || '';

    const matchesSearch =
      code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());

    const status = (o.status || o.service_status || '').toUpperCase();
    const payStatus = (o.payment_status || '').toUpperCase();

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && (status === 'PENDING' || payStatus === 'PENDING')) ||
      (statusFilter === 'processing' && status === 'PROCESSING') ||
      (statusFilter === 'completed' && status === 'COMPLETED') ||
      (statusFilter === 'paid' && payStatus === 'PAID');

    return matchesSearch && matchesStatus;
  });

  // Order Actions
  function openEditOrder(order: any) {
    selectedOrder = order;
    editPaymentStatus = (order.payment_status || 'PENDING').toUpperCase();
    editServiceStatus = (order.status || order.service_status || 'PENDING').toUpperCase();
    editAdminNote = order.notes || order.admin_note || '';
    isEditOrderModalOpen = true;
  }

  async function handleSaveOrderChanges() {
    if (!selectedOrder) return;
    savingOrder = true;
    try {
      const res = await updateOrderStatus(selectedOrder.id || selectedOrder.order_code, {
        paymentStatus: editPaymentStatus,
        serviceStatus: editServiceStatus,
        adminNote: editAdminNote.trim() || undefined,
      });

      if (res.success) {
        toast.success(`Pesanan #${selectedOrder.order_code} berhasil diperbarui!`);
        isEditOrderModalOpen = false;
        await loadData();
      } else {
        toast.error(res.error || 'Gagal menyimpan perubahan status.');
      }
    } catch (e) {
      toast.error('Gagal memperbarui status order.');
    } finally {
      savingOrder = false;
    }
  }

  // Package Management Actions
  function openCreatePackage() {
    isEditingPackage = false;
    currentPackageId = null;
    pkgName = '';
    pkgCategory = 'INDONESIA';
    pkgFollowers = 1000;
    pkgPrice = 79000;
    pkgEstimatedTime = '1-5 Menit';
    pkgBadge = '';
    pkgDescription = '';
    pkgIsActive = true;
    isPackageModalOpen = true;
  }

  function openEditPackage(pkg: Package) {
    isEditingPackage = true;
    currentPackageId = pkg.id;
    pkgName = pkg.name;
    pkgCategory = (pkg as any).category || 'INDONESIA';
    pkgFollowers = pkg.followers || (pkg as any).amount || 1000;
    pkgPrice = pkg.price;
    pkgEstimatedTime = pkg.estimated_time || (pkg as any).processing_time || '1-5 Menit';
    pkgBadge = pkg.badge || '';
    pkgDescription = pkg.description || '';
    pkgIsActive = pkg.is_active ?? true;
    isPackageModalOpen = true;
  }

  async function handleSavePackage() {
    if (!pkgName || pkgFollowers <= 0 || pkgPrice < 0) {
      toast.error('Silakan lengkapi data paket dengan benar.');
      return;
    }

    savingPackage = true;
    try {
      const payload = {
        name: pkgName,
        category: pkgCategory,
        amount: Number(pkgFollowers),
        followers: Number(pkgFollowers),
        price: Number(pkgPrice),
        processing_time: pkgEstimatedTime,
        estimatedTime: pkgEstimatedTime,
        badge: pkgBadge.trim() || null,
        description: pkgDescription.trim() || null,
        is_active: pkgIsActive,
        isActive: pkgIsActive,
      };

      if (isEditingPackage && currentPackageId) {
        const res = await updatePackageAdmin(currentPackageId, payload);
        if (res.success) {
          toast.success('Paket berhasil diperbarui!');
        } else {
          toast.error(res.error || 'Gagal memperbarui paket.');
        }
      } else {
        const res = await createPackageAdmin(payload);
        if (res.success) {
          toast.success('Paket baru berhasil ditambahkan!');
        } else {
          toast.error(res.error || 'Gagal menambahkan paket.');
        }
      }

      isPackageModalOpen = false;
      await loadData();
    } catch (e) {
      toast.error('Gagal menyimpan paket.');
    } finally {
      savingPackage = false;
    }
  }

  async function handleDeletePackage(pkg: Package) {
    if (!confirm(`Hapus atau nonaktifkan paket "${pkg.name}"?`)) return;

    try {
      const res = await deletePackageAdmin(pkg.id);
      if (res.success) {
        toast.success('Paket berhasil dihapus / dinonaktifkan.');
        await loadData();
      } else {
        toast.error(res.error || 'Gagal menghapus paket.');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus paket.');
    }
  }

  // Free Order Actions
  function openFreeOrderModal() {
    if (packages.length > 0 && !freeOrderPackageId) {
      freeOrderPackageId = packages[0].id;
    }
    freeOrderUsername = '';
    isFreeOrderModalOpen = true;
  }

  async function handleCreateFreeOrder() {
    if (!freeOrderPackageId || !freeOrderUsername.trim()) {
      toast.error('Pilih paket dan masukkan username Instagram target.');
      return;
    }

    savingFreeOrder = true;
    try {
      const res = await createAdminFreeOrder({
        package_id: freeOrderPackageId,
        target_username: freeOrderUsername.replace(/^@/, '').trim(),
        customer_name: freeOrderCustomerName.trim() || 'Admin Order',
        customer_email: freeOrderCustomerEmail.trim() || 'admin@portalfollowers.com',
        customer_whatsapp: freeOrderCustomerWhatsapp.trim() || '08000000000',
        notes: freeOrderNotes.trim() || 'Admin Free Order'
      });

      if (res.success) {
        toast.success('Order gratis khusus admin berhasil dibuat & langsung diproses!');
        isFreeOrderModalOpen = false;
        await loadFreeOrders();
        await loadData();
      } else {
        toast.error(res.error || 'Gagal membuat order gratis admin.');
      }
    } catch (e) {
      toast.error('Gagal menghubungi server untuk order gratis.');
    } finally {
      savingFreeOrder = false;
    }
  }

  // Fulfillment Actions
  function openEditFulfillment(task: any) {
    selectedFulfillment = task;
    editFulfillmentStatus = task.status || 'PENDING';
    editProviderOrderId = task.provider_order_id || '';
    editStartCount = task.start_count ?? null;
    editRemains = task.remains ?? null;
    editFulfillmentNotes = task.notes || '';
    isFulfillmentModalOpen = true;
  }

  async function handleSaveFulfillment() {
    if (!selectedFulfillment) return;
    savingFulfillment = true;
    try {
      const res = await updateAdminFulfillment(selectedFulfillment.id, {
        status: editFulfillmentStatus,
        provider_order_id: editProviderOrderId.trim() || undefined,
        start_count: editStartCount !== null && !isNaN(Number(editStartCount)) ? Number(editStartCount) : undefined,
        remains: editRemains !== null && !isNaN(Number(editRemains)) ? Number(editRemains) : undefined,
        notes: editFulfillmentNotes.trim() || undefined
      });

      if (res.success) {
        toast.success('Status fulfillment berhasil diperbarui!');
        isFulfillmentModalOpen = false;
        await loadFulfillment();
        await loadData();
      } else {
        toast.error(res.error || 'Gagal memperbarui status fulfillment.');
      }
    } catch (e) {
      toast.error('Gagal menghubungi server.');
    } finally {
      savingFulfillment = false;
    }
  }
</script>

<svelte:head>
  <title>Admin Dashboard & Orders - Portal Followers</title>
</svelte:head>

<div class="admin-page">
  <div class="container">
    <!-- Header -->
    <div class="admin-header">
      <div>
        <div class="badge badge-glow" style="margin-bottom: 0.5rem;">
          <Shield size={12} color="#ec4899" />
          <span>Admin Executive Suite</span>
        </div>
        <h1 class="admin-title">Panel Kontrol & Manajemen</h1>
        <p class="admin-sub">Pantau performa layanan, webhook Xendit, kelola pesanan, pelanggan & log audit</p>
      </div>

      <div class="admin-header-actions">
        <button class="btn btn-outline btn-sm" on:click={openFreeOrderModal}>
          <Gift size={14} color="#ec4899" />
          <span>Buat Order Gratis</span>
        </button>
        <button class="btn btn-secondary btn-sm" on:click={loadData}>
          <RefreshCw size={14} />
          <span>Refresh Data</span>
        </button>
      </div>
    </div>

    <!-- Analytics Metric Cards -->
    <div class="metrics-grid">
      <div class="glass-card metric-card">
        <div class="metric-icon-box" style="background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.3);">
          <DollarSign size={24} color="#10b981" />
        </div>
        <div>
          <span class="metric-label">Total Pendapatan (Lunas)</span>
          <h2 class="metric-val text-gradient">{formatCurrency(totalRevenue)}</h2>
        </div>
      </div>

      <div class="glass-card metric-card">
        <div class="metric-icon-box" style="background: rgba(236, 72, 153, 0.12); border-color: rgba(236, 72, 153, 0.3);">
          <PackageCheck size={24} color="#ec4899" />
        </div>
        <div>
          <span class="metric-label">Total Pesanan Masuk</span>
          <h2 class="metric-val">{totalOrders}</h2>
        </div>
      </div>

      <div class="glass-card metric-card">
        <div class="metric-icon-box" style="background: rgba(245, 158, 11, 0.12); border-color: rgba(245, 158, 11, 0.3);">
          <Clock size={24} color="#f59e0b" />
        </div>
        <div>
          <span class="metric-label">Menunggu / Pending</span>
          <h2 class="metric-val">{pendingOrders}</h2>
        </div>
      </div>

      <div class="glass-card metric-card">
        <div class="metric-icon-box" style="background: rgba(6, 182, 212, 0.12); border-color: rgba(6, 182, 212, 0.3);">
          <Zap size={24} color="#06b6d4" />
        </div>
        <div>
          <span class="metric-label">Sedang Diproses</span>
          <h2 class="metric-val">{processingOrders}</h2>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs-nav-bar">
      <div class="tabs-list">
        <button
          class="tab-btn {activeTab === 'orders' ? 'active-tab' : ''}"
          on:click={() => switchTab('orders')}
        >
          <PackageCheck size={16} />
          <span>Pesanan ({orders.length})</span>
        </button>
        <button
          class="tab-btn {activeTab === 'packages' ? 'active-tab' : ''}"
          on:click={() => switchTab('packages')}
        >
          <DollarSign size={16} />
          <span>Paket ({packages.length})</span>
        </button>
        <button
          class="tab-btn {activeTab === 'payments' ? 'active-tab' : ''}"
          on:click={() => switchTab('payments')}
        >
          <CreditCard size={16} />
          <span>Xendit Logs</span>
        </button>
        <button
          class="tab-btn {activeTab === 'customers' ? 'active-tab' : ''}"
          on:click={() => switchTab('customers')}
        >
          <Users size={16} />
          <span>Pelanggan</span>
        </button>
        <button
          class="tab-btn {activeTab === 'fulfillment' ? 'active-tab' : ''}"
          on:click={() => switchTab('fulfillment')}
        >
          <Activity size={16} />
          <span>Fulfillment</span>
        </button>
        <button
          class="tab-btn {activeTab === 'free_orders' ? 'active-tab' : ''}"
          on:click={() => switchTab('free_orders')}
        >
          <Gift size={16} />
          <span>Order Gratis</span>
        </button>
        <button
          class="tab-btn {activeTab === 'logs' ? 'active-tab' : ''}"
          on:click={() => switchTab('logs')}
        >
          <ListOrdered size={16} />
          <span>Audit Log</span>
        </button>
      </div>

      {#if activeTab === 'packages'}
        <button class="btn btn-primary btn-sm" on:click={openCreatePackage}>
          <Plus size={15} />
          <span>Tambah Paket Baru</span>
        </button>
      {:else if activeTab === 'free_orders'}
        <button class="btn btn-primary btn-sm" on:click={openFreeOrderModal}>
          <Plus size={15} />
          <span>Buat Order Gratis</span>
        </button>
      {/if}
    </div>

    <!-- TAB 1: KELOLA ORDER -->
    {#if activeTab === 'orders'}
      <div class="glass-panel admin-content-card">
        <div class="content-toolbar">
          <div class="search-box">
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Cari order ID, username IG, email, nama..."
              bind:value={searchQuery}
              class="search-input"
            />
          </div>

          <div class="status-filter-pills">
            <button
              class="filter-pill {statusFilter === 'all' ? 'active-pill' : ''}"
              on:click={() => (statusFilter = 'all')}
            >
              Semua ({orders.length})
            </button>
            <button
              class="filter-pill {statusFilter === 'pending' ? 'active-pill' : ''}"
              on:click={() => (statusFilter = 'pending')}
            >
              Pending ({pendingOrders})
            </button>
            <button
              class="filter-pill {statusFilter === 'processing' ? 'active-pill' : ''}"
              on:click={() => (statusFilter = 'processing')}
            >
              Proses ({processingOrders})
            </button>
            <button
              class="filter-pill {statusFilter === 'completed' ? 'active-pill' : ''}"
              on:click={() => (statusFilter = 'completed')}
            >
              Selesai ({completedOrders})
            </button>
          </div>
        </div>

        {#if loading}
          <div style="padding: 2rem;">
            <Skeleton height="50px" count={5} />
          </div>
        {:else if filteredOrders.length === 0}
          <div class="empty-state">
            <p>Tidak ada pesanan yang sesuai dengan pencarian.</p>
          </div>
        {:else}
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Order ID & Waktu</th>
                  <th>Target Instagram</th>
                  <th>Pemesan</th>
                  <th>Jumlah & Kategori</th>
                  <th>Total Tagihan</th>
                  <th>Status Bayar</th>
                  <th>Status Layanan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {#each filteredOrders as ord}
                  <tr>
                    <td>
                      <span class="font-bold text-white block">{ord.order_code}</span>
                      <span class="text-sub">{formatDate(ord.created_at)}</span>
                    </td>
                    <td>
                      <a
                        href="https://www.instagram.com/{ord.target_username || ord.instagram_username}/"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="ig-cell"
                      >
                        <Instagram size={14} color="#ec4899" />
                        <span>@{ord.target_username || ord.instagram_username} ↗</span>
                      </a>
                    </td>
                    <td>
                      <span class="text-white font-medium block">{ord.customer_name}</span>
                      <span class="text-sub">{ord.customer_email}</span>
                    </td>
                    <td>
                      <span class="followers-chip">+{formatNumber(ord.followers_amount || (ord as any).amount_followers || 0)} F</span>
                      {#if (ord as any).package_category}
                        <span class="category-tag">{(ord as any).package_category}</span>
                      {/if}
                    </td>
                    <td class="font-bold text-white">
                      {#if ord.is_admin_order || !ord.payment_required}
                        <span class="badge badge-info">Gratis Admin (Rp 0)</span>
                      {:else}
                        {formatCurrency(ord.amount || ord.price)}
                      {/if}
                    </td>
                    <td>
                      <span class="badge {(ord.payment_status || '').toUpperCase() === 'PAID' || (ord.payment_status || '').toUpperCase() === 'ADMIN_APPROVED' ? 'badge-success' : 'badge-warning'}">
                        {ord.payment_status}
                      </span>
                    </td>
                    <td>
                      <span class="badge {(ord.status || ord.service_status) === 'COMPLETED' ? 'badge-success' : (ord.status || ord.service_status) === 'PROCESSING' ? 'badge-info' : 'badge-warning'}">
                        {ord.status || ord.service_status}
                      </span>
                    </td>
                    <td>
                      <div class="action-btn-group">
                        <button class="btn btn-primary btn-sm" on:click={() => openEditOrder(ord)}>
                          <Edit size={13} />
                          <span>Ubah</span>
                        </button>
                        <a href="/order/{ord.order_code}" target="_blank" class="btn btn-secondary btn-sm" title="Buka Detail">
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/if}

    <!-- TAB 2: KELOLA PAKET -->
    {#if activeTab === 'packages'}
      <div class="glass-panel admin-content-card">
        <div class="content-toolbar">
          <div>
            <h3 class="orders-title">Daftar Paket Followers Instagram</h3>
            <p class="orders-sub">Harga dan kategori tersinkronisasi langsung ke database MySQL</p>
          </div>
        </div>

        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Nama Paket & Kategori</th>
                <th>Followers</th>
                <th>Harga Layanan</th>
                <th>Estimasi Proses</th>
                <th>Badge</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {#each packages as p}
                <tr>
                  <td>
                    <span class="font-bold text-white block">{p.name}</span>
                    <span class="category-tag">{(p as any).category || 'INDONESIA'}</span>
                    <span class="text-sub block" style="margin-top: 2px;">{p.description || '-'}</span>
                  </td>
                  <td>
                    <span class="followers-chip">+{formatNumber(p.followers || (p as any).amount || 0)}</span>
                  </td>
                  <td class="font-bold text-white">{formatCurrency(p.price)}</td>
                  <td>{p.estimated_time || (p as any).processing_time || '1-5 Menit'}</td>
                  <td>
                    {#if p.badge}
                      <span class="badge badge-glow">{p.badge}</span>
                    {:else}
                      <span class="text-sub">-</span>
                    {/if}
                  </td>
                  <td>
                    {#if p.is_active ?? true}
                      <span class="badge badge-success">Aktif</span>
                    {:else}
                      <span class="badge badge-warning">Non-Aktif</span>
                    {/if}
                  </td>
                  <td>
                    <div class="action-btn-group">
                      <button class="btn btn-secondary btn-sm" on:click={() => openEditPackage(p)}>
                        <Edit size={13} />
                        <span>Edit</span>
                      </button>
                      <button class="btn btn-outline btn-sm delete-btn" on:click={() => handleDeletePackage(p)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- TAB 3: XENDIT LOGS & WEBHOOKS -->
    {#if activeTab === 'payments'}
      <div class="glass-panel admin-content-card">
        <div class="content-toolbar">
          <div>
            <h3 class="orders-title">Log Pembayaran & Webhook Xendit</h3>
            <p class="orders-sub">Riwayat invoice Xendit dan status verifikasi token callback webhook</p>
          </div>
          <button class="btn btn-secondary btn-sm" on:click={loadPayments}>
            <RefreshCw size={13} />
            <span>Muat Ulang</span>
          </button>
        </div>

        <h4 style="color: #fff; font-size: 0.95rem; margin-bottom: 0.75rem;">1. Riwayat Transaksi Xendit</h4>
        <div class="table-responsive" style="margin-bottom: 2rem;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Xendit Invoice ID</th>
                <th>Nominal</th>
                <th>Metode</th>
                <th>Status Bayar</th>
                <th>Waktu Transaksi</th>
              </tr>
            </thead>
            <tbody>
              {#if paymentLogs.length === 0}
                <tr>
                  <td colspan="6" style="text-align: center; color: var(--color-text-muted);">Belum ada riwayat transaksi pembayaran.</td>
                </tr>
              {:else}
                {#each paymentLogs as pay}
                  <tr>
                    <td><span class="font-bold text-white">{pay.order_code}</span></td>
                    <td>
                      {#if pay.xendit_invoice_url}
                        <a href={pay.xendit_invoice_url} target="_blank" class="ig-cell">
                          <span>{pay.xendit_invoice_id || 'Buka Invoice'} ↗</span>
                        </a>
                      {:else}
                        <span class="text-sub">{pay.xendit_invoice_id || '-'}</span>
                      {/if}
                    </td>
                    <td class="font-bold text-white">{formatCurrency(pay.amount)}</td>
                    <td><span class="badge badge-info">{pay.payment_method || 'XENDIT'}</span></td>
                    <td>
                      <span class="badge {pay.status === 'PAID' ? 'badge-success' : 'badge-warning'}">{pay.status}</span>
                    </td>
                    <td class="text-sub">{formatDate(pay.created_at)}</td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>

        <h4 style="color: #fff; font-size: 0.95rem; margin-bottom: 0.75rem;">2. Webhook Event Notifications</h4>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Tipe Event</th>
                <th>Status Proses</th>
                <th>Waktu Masuk</th>
              </tr>
            </thead>
            <tbody>
              {#if webhookLogs.length === 0}
                <tr>
                  <td colspan="4" style="text-align: center; color: var(--color-text-muted);">Belum ada event webhook tercatat.</td>
                </tr>
              {:else}
                {#each webhookLogs as wh}
                  <tr>
                    <td><span class="font-bold text-white">{wh.event_id}</span></td>
                    <td><span class="badge badge-glow">{wh.event_type}</span></td>
                    <td>
                      <span class="badge {wh.status === 'PROCESSED' ? 'badge-success' : 'badge-warning'}">{wh.status}</span>
                    </td>
                    <td class="text-sub">{formatDate(wh.created_at)}</td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- TAB 4: DATA PELANGGAN -->
    {#if activeTab === 'customers'}
      <div class="glass-panel admin-content-card">
        <div class="content-toolbar">
          <div>
            <h3 class="orders-title">Data Pelanggan Terdaftar</h3>
            <p class="orders-sub">Statistik pesanan dan total pengeluaran per pelanggan</p>
          </div>
          <button class="btn btn-secondary btn-sm" on:click={loadCustomers}>
            <RefreshCw size={13} />
            <span>Muat Ulang</span>
          </button>
        </div>

        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Nama Pelanggan</th>
                <th>Email & WhatsApp</th>
                <th>Role</th>
                <th>Total Pesanan</th>
                <th>Total Belanja</th>
                <th>Terdaftar Sejak</th>
              </tr>
            </thead>
            <tbody>
              {#if customers.length === 0}
                <tr>
                  <td colspan="6" style="text-align: center; color: var(--color-text-muted);">Belum ada pelanggan terdaftar.</td>
                </tr>
              {:else}
                {#each customers as c}
                  <tr>
                    <td><span class="font-bold text-white">{c.full_name || 'Tanpa Nama'}</span></td>
                    <td>
                      <span class="text-white block">{c.email}</span>
                      <span class="text-sub">{c.whatsapp || c.phone || '-'}</span>
                    </td>
                    <td><span class="badge {c.role === 'ADMIN' ? 'badge-glow' : 'badge-info'}">{c.role}</span></td>
                    <td><span class="followers-chip">{c.total_orders || 0} Order</span></td>
                    <td class="font-bold text-white">{formatCurrency(c.total_spent || 0)}</td>
                    <td class="text-sub">{formatDate(c.created_at)}</td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- TAB 5: FULFILLMENT TASKS -->
    {#if activeTab === 'fulfillment'}
      <div class="glass-panel admin-content-card">
        <div class="content-toolbar">
          <div>
            <h3 class="orders-title">Antrean Task Fulfillment Layanan</h3>
            <p class="orders-sub">Kelola eksekusi pengiriman followers Instagram langsung ke akun tujuan</p>
          </div>
          <button class="btn btn-secondary btn-sm" on:click={loadFulfillment}>
            <RefreshCw size={13} />
            <span>Muat Ulang</span>
          </button>
        </div>

        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order Code</th>
                <th>Target Akun</th>
                <th>Jumlah Pengiriman</th>
                <th>Provider ID</th>
                <th>Status Task</th>
                <th>Catatan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {#if fulfillmentTasks.length === 0}
                <tr>
                  <td colspan="7" style="text-align: center; color: var(--color-text-muted);">Tidak ada antrean task fulfillment.</td>
                </tr>
              {:else}
                {#each fulfillmentTasks as task}
                  <tr>
                    <td><span class="font-bold text-white">{task.order_code || '-'}</span></td>
                    <td>
                      <a
                        href="https://www.instagram.com/{task.target_username}/"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="ig-cell"
                      >
                        <Instagram size={14} color="#ec4899" />
                        <span>@{task.target_username} ↗</span>
                      </a>
                    </td>
                    <td><span class="followers-chip">+{formatNumber(task.quantity)} Followers</span></td>
                    <td><span class="text-sub">{task.provider_order_id || '-'}</span></td>
                    <td>
                      <span class="badge {task.status === 'COMPLETED' ? 'badge-success' : task.status === 'IN_PROGRESS' ? 'badge-info' : task.status === 'FAILED' ? 'badge-warning' : 'badge-warning'}">
                        {task.status}
                      </span>
                    </td>
                    <td class="text-sub">{task.notes || '-'}</td>
                    <td>
                      <button class="btn btn-primary btn-sm" on:click={() => openEditFulfillment(task)}>
                        <Edit size={13} />
                        <span>Update</span>
                      </button>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- TAB 6: ORDER GRATIS ADMIN -->
    {#if activeTab === 'free_orders'}
      <div class="glass-panel admin-content-card">
        <div class="content-toolbar">
          <div>
            <h3 class="orders-title">Riwayat Order Gratis Khusus Admin</h3>
            <p class="orders-sub">Order bebas tagihan (Rp 0) langsung diproses otomatis untuk promosi dan reward</p>
          </div>
          <button class="btn btn-primary btn-sm" on:click={openFreeOrderModal}>
            <Plus size={15} />
            <span>Buat Order Gratis Baru</span>
          </button>
        </div>

        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order ID & Waktu</th>
                <th>Target Instagram</th>
                <th>Paket Layanan</th>
                <th>Pembuat</th>
                <th>Status Pembayaran</th>
                <th>Status Proses</th>
              </tr>
            </thead>
            <tbody>
              {#if freeOrders.length === 0}
                <tr>
                  <td colspan="6" style="text-align: center; color: var(--color-text-muted);">Belum ada order gratis yang dibuat.</td>
                </tr>
              {:else}
                {#each freeOrders as fo}
                  <tr>
                    <td>
                      <span class="font-bold text-white block">{fo.order_code}</span>
                      <span class="text-sub">{formatDate(fo.created_at)}</span>
                    </td>
                    <td>
                      <a href="https://www.instagram.com/{fo.target_username}/" target="_blank" class="ig-cell">
                        <Instagram size={14} color="#ec4899" />
                        <span>@{fo.target_username} ↗</span>
                      </a>
                    </td>
                    <td>
                      <span class="font-bold text-white">{fo.package_name || '-'}</span>
                      <span class="category-tag">{fo.package_category || 'PROMO'}</span>
                    </td>
                    <td><span class="text-sub">{fo.admin_creator_email || 'Admin'}</span></td>
                    <td><span class="badge badge-success">ADMIN_APPROVED (Rp 0)</span></td>
                    <td><span class="badge badge-info">{fo.status}</span></td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- TAB 7: AUDIT LOGS -->
    {#if activeTab === 'logs'}
      <div class="glass-panel admin-content-card">
        <div class="content-toolbar">
          <div>
            <h3 class="orders-title">Log Aktivitas & Audit Admin</h3>
            <p class="orders-sub">Rekaman lengkap setiap aksi sensitif (perubahan paket, status order, order gratis)</p>
          </div>
          <button class="btn btn-secondary btn-sm" on:click={loadLogs}>
            <RefreshCw size={13} />
            <span>Muat Ulang</span>
          </button>
        </div>

        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Admin</th>
                <th>Aksi</th>
                <th>Target</th>
                <th>Detail & IP</th>
              </tr>
            </thead>
            <tbody>
              {#if adminLogs.length === 0}
                <tr>
                  <td colspan="5" style="text-align: center; color: var(--color-text-muted);">Belum ada log audit admin.</td>
                </tr>
              {:else}
                {#each adminLogs as log}
                  <tr>
                    <td class="text-sub">{formatDate(log.created_at)}</td>
                    <td>
                      <span class="text-white font-medium block">{log.admin_name || log.admin_email || 'Admin'}</span>
                    </td>
                    <td><span class="badge badge-glow">{log.action}</span></td>
                    <td><span class="category-tag">{log.target_type} ({log.target_id ? log.target_id.slice(0, 8) + '...' : '-'})</span></td>
                    <td>
                      <pre class="log-details-box">{JSON.stringify(log.details, null, 2)}</pre>
                      {#if log.ip_address}
                        <span class="text-sub" style="font-size: 0.75rem;">IP: {log.ip_address}</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Modal Ubah Status Order -->
{#if isEditOrderModalOpen && selectedOrder}
  <div class="modal-backdrop animate-fade-in" on:click|self={() => (isEditOrderModalOpen = false)}>
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h3>Kelola Pesanan #{selectedOrder.order_code}</h3>
          <p class="modal-sub">Target: @{selectedOrder.target_username || selectedOrder.instagram_username}</p>
        </div>
        <button class="modal-close" on:click={() => (isEditOrderModalOpen = false)}>
          <X size={18} />
        </button>
      </div>

      <form on:submit|preventDefault={handleSaveOrderChanges} class="modal-form">
        <div class="form-group">
          <label for="edit-payment-status" class="input-label">Status Pembayaran</label>
          <select id="edit-payment-status" class="input-field" bind:value={editPaymentStatus}>
            <option value="PENDING">PENDING (Menunggu Pembayaran)</option>
            <option value="PAID">PAID (Lunas / Terverifikasi)</option>
            <option value="ADMIN_APPROVED">ADMIN_APPROVED (Gratis / Disetujui Admin)</option>
            <option value="FAILED">FAILED (Gagal / Ditolak)</option>
            <option value="EXPIRED">EXPIRED (Kadaluarsa)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="edit-service-status" class="input-label">Status Layanan Followers</label>
          <select id="edit-service-status" class="input-field" bind:value={editServiceStatus}>
            <option value="PENDING">PENDING (Menunggu)</option>
            <option value="PAID">PAID (Pembayaran Terkonfirmasi)</option>
            <option value="PROCESSING">PROCESSING (Sedang Diproses)</option>
            <option value="COMPLETED">COMPLETED (Selesai 100%)</option>
            <option value="FAILED">FAILED (Gagal / Batal)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="edit-admin-note" class="input-label">Catatan Admin / Internal</label>
          <textarea
            id="edit-admin-note"
            class="input-field"
            rows="3"
            placeholder="Tambahkan catatan untuk riwayat atau pelanggan..."
            bind:value={editAdminNote}
          ></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" on:click={() => (isEditOrderModalOpen = false)}>
            Batal
          </button>
          <button type="submit" class="btn btn-primary" disabled={savingOrder}>
            <span>{savingOrder ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal Tambah / Edit Paket -->
{#if isPackageModalOpen}
  <div class="modal-backdrop animate-fade-in" on:click|self={() => (isPackageModalOpen = false)}>
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h3>{isEditingPackage ? 'Edit Paket Followers' : 'Tambah Paket Baru'}</h3>
          <p class="modal-sub">Perubahan akan langsung terlihat oleh pengguna di halaman katalog</p>
        </div>
        <button class="modal-close" on:click={() => (isPackageModalOpen = false)}>
          <X size={18} />
        </button>
      </div>

      <form on:submit|preventDefault={handleSavePackage} class="modal-form">
        <div class="form-group">
          <label for="pkg-name-input" class="input-label">Nama Paket</label>
          <input
            id="pkg-name-input"
            type="text"
            class="input-field"
            placeholder="Contoh: Influencer Popular"
            bind:value={pkgName}
            required
          />
        </div>

        <div class="form-group">
          <label for="pkg-category-input" class="input-label">Kategori Layanan</label>
          <select id="pkg-category-input" class="input-field" bind:value={pkgCategory}>
            <option value="INDONESIA">Followers Indonesia (Aktif / Real Target)</option>
            <option value="INTERNATIONAL">Followers Internasional (Global High Quality)</option>
            <option value="PROMOTION_PAID">Promo Berbayar (Diskon Spesial)</option>
            <option value="PROMOTION_FREE">Promo Gratis (Trial / Free Tier)</option>
          </select>
        </div>

        <div class="grid-2-col">
          <div class="form-group">
            <label for="pkg-followers-input" class="input-label">Jumlah Followers</label>
            <input
              id="pkg-followers-input"
              type="number"
              class="input-field"
              min="1"
              bind:value={pkgFollowers}
              required
            />
          </div>
          <div class="form-group">
            <label for="pkg-price-input" class="input-label">Harga (IDR)</label>
            <input
              id="pkg-price-input"
              type="number"
              class="input-field"
              min="0"
              bind:value={pkgPrice}
              required
            />
          </div>
        </div>

        <div class="grid-2-col">
          <div class="form-group">
            <label for="pkg-time-input" class="input-label">Estimasi Waktu Proses</label>
            <input
              id="pkg-time-input"
              type="text"
              class="input-field"
              placeholder="Contoh: 1-5 Menit"
              bind:value={pkgEstimatedTime}
              required
            />
          </div>
          <div class="form-group">
            <label for="pkg-badge-input" class="input-label">Badge Label (Opsional)</label>
            <input
              id="pkg-badge-input"
              type="text"
              class="input-field"
              placeholder="Contoh: Paling Populer / Hemat"
              bind:value={pkgBadge}
            />
          </div>
        </div>

        <div class="form-group">
          <label for="pkg-desc-input" class="input-label">Deskripsi Paket</label>
          <textarea
            id="pkg-desc-input"
            class="input-field"
            rows="2"
            placeholder="Deskripsi singkat keunggulan paket..."
            bind:value={pkgDescription}
          ></textarea>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={pkgIsActive} />
            <span>Aktifkan paket untuk dipesan pelanggan</span>
          </label>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" on:click={() => (isPackageModalOpen = false)}>
            Batal
          </button>
          <button type="submit" class="btn btn-primary" disabled={savingPackage}>
            <span>{savingPackage ? 'Menyimpan...' : 'Simpan Paket'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal Buat Order Gratis Khusus Admin -->
{#if isFreeOrderModalOpen}
  <div class="modal-backdrop animate-fade-in" on:click|self={() => (isFreeOrderModalOpen = false)}>
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h3>Buat Order Gratis (Khusus Admin)</h3>
          <p class="modal-sub">Order bebas biaya (Rp 0) dengan status pembayaran langsung disetujui</p>
        </div>
        <button class="modal-close" on:click={() => (isFreeOrderModalOpen = false)}>
          <X size={18} />
        </button>
      </div>

      <form on:submit|preventDefault={handleCreateFreeOrder} class="modal-form">
        <div class="form-group">
          <label for="free-pkg-select" class="input-label">Pilih Paket Layanan</label>
          <select id="free-pkg-select" class="input-field" bind:value={freeOrderPackageId} required>
            {#each packages as pkg}
              <option value={pkg.id}>
                {pkg.name} ({formatNumber(pkg.followers || (pkg as any).amount || 0)} Followers) - {(pkg as any).category || 'Katalog'}
              </option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="free-target-ig" class="input-label">Target Username Instagram</label>
          <input
            id="free-target-ig"
            type="text"
            class="input-field"
            placeholder="Contoh: travel_indonesia (tanpa @)"
            bind:value={freeOrderUsername}
            required
          />
        </div>

        <div class="grid-2-col">
          <div class="form-group">
            <label for="free-cust-name" class="input-label">Nama Pemesan</label>
            <input id="free-cust-name" type="text" class="input-field" bind:value={freeOrderCustomerName} />
          </div>
          <div class="form-group">
            <label for="free-cust-wa" class="input-label">WhatsApp</label>
            <input id="free-cust-wa" type="text" class="input-field" bind:value={freeOrderCustomerWhatsapp} />
          </div>
        </div>

        <div class="form-group">
          <label for="free-cust-email" class="input-label">Email Pemesan</label>
          <input id="free-cust-email" type="email" class="input-field" bind:value={freeOrderCustomerEmail} />
        </div>

        <div class="form-group">
          <label for="free-order-notes" class="input-label">Alasan / Catatan Admin</label>
          <textarea
            id="free-order-notes"
            class="input-field"
            rows="2"
            placeholder="Contoh: Reward giveaway / testing partner"
            bind:value={freeOrderNotes}
          ></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" on:click={() => (isFreeOrderModalOpen = false)}>
            Batal
          </button>
          <button type="submit" class="btn btn-primary" disabled={savingFreeOrder}>
            <span>{savingFreeOrder ? 'Memproses...' : 'Kirim Order Gratis'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal Update Fulfillment Task -->
{#if isFulfillmentModalOpen && selectedFulfillment}
  <div class="modal-backdrop animate-fade-in" on:click|self={() => (isFulfillmentModalOpen = false)}>
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h3>Update Task Fulfillment</h3>
          <p class="modal-sub">Target @{selectedFulfillment.target_username} ({formatNumber(selectedFulfillment.quantity)} F)</p>
        </div>
        <button class="modal-close" on:click={() => (isFulfillmentModalOpen = false)}>
          <X size={18} />
        </button>
      </div>

      <form on:submit|preventDefault={handleSaveFulfillment} class="modal-form">
        <div class="form-group">
          <label for="ful-status-input" class="input-label">Status Fulfillment</label>
          <select id="ful-status-input" class="input-field" bind:value={editFulfillmentStatus}>
            <option value="PENDING">PENDING (Menunggu Eksekusi)</option>
            <option value="IN_PROGRESS">IN_PROGRESS (Sedang Dialirkan)</option>
            <option value="COMPLETED">COMPLETED (Selesai 100%)</option>
            <option value="FAILED">FAILED (Gagal)</option>
            <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="ful-provider-id" class="input-label">Provider / SMM Order ID (Opsional)</label>
          <input
            id="ful-provider-id"
            type="text"
            class="input-field"
            placeholder="Contoh: SMM-994812"
            bind:value={editProviderOrderId}
          />
        </div>

        <div class="grid-2-col">
          <div class="form-group">
            <label for="ful-start-count" class="input-label">Start Count Followers</label>
            <input id="ful-start-count" type="number" class="input-field" placeholder="Contoh: 1250" bind:value={editStartCount} />
          </div>
          <div class="form-group">
            <label for="ful-remains" class="input-label">Remains / Sisa</label>
            <input id="ful-remains" type="number" class="input-field" placeholder="Contoh: 0" bind:value={editRemains} />
          </div>
        </div>

        <div class="form-group">
          <label for="ful-notes" class="input-label">Catatan Fulfillment</label>
          <textarea
            id="ful-notes"
            class="input-field"
            rows="2"
            placeholder="Catatan update progress fulfillment..."
            bind:value={editFulfillmentNotes}
          ></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" on:click={() => (isFulfillmentModalOpen = false)}>
            Batal
          </button>
          <button type="submit" class="btn btn-primary" disabled={savingFulfillment}>
            <span>{savingFulfillment ? 'Menyimpan...' : 'Simpan Update'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .admin-page {
    padding: 3.5rem 0 6rem;
  }

  .admin-header {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2.5rem;
  }

  @media (min-width: 768px) {
    .admin-header {
      flex-direction: row;
      align-items: center;
    }
  }

  .admin-header-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .admin-title {
    font-size: 2rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.02em;
    margin-bottom: 0.25rem;
  }

  .admin-sub {
    color: var(--color-text-muted);
    font-size: 0.95rem;
  }

  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1.25rem;
    margin-bottom: 2.5rem;
  }

  @media (min-width: 640px) {
    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .metrics-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .metric-card {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1.5rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  .metric-icon-box {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid;
    flex-shrink: 0;
  }

  .metric-label {
    display: block;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .metric-val {
    font-size: 1.4rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.2;
  }

  /* Tabs Bar */
  .tabs-nav-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .tabs-list {
    display: flex;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.03);
    padding: 0.35rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    overflow-x: auto;
    max-width: 100%;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border-radius: var(--radius-sm);
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
  }

  .tab-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.05);
  }

  .tab-btn.active-tab {
    background: var(--color-primary);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
  }

  /* Toolbar */
  .admin-content-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
  }

  .content-toolbar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  @media (min-width: 768px) {
    .content-toolbar {
      flex-direction: row;
      align-items: center;
    }
  }

  .orders-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #ffffff;
  }

  .orders-sub {
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 320px;
  }

  .search-box :global(svg) {
    position: absolute;
    left: 1rem;
  }

  .search-input {
    width: 100%;
    padding: 0.6rem 1rem 0.6rem 2.5rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: #ffffff;
    font-size: 0.875rem;
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .search-input:focus {
    border-color: var(--color-primary);
  }

  .status-filter-pills {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .filter-pill {
    padding: 0.4rem 0.85rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .filter-pill:hover {
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.2);
  }

  .filter-pill.active-pill {
    background: rgba(236, 72, 153, 0.15);
    border-color: var(--color-primary);
    color: var(--color-primary);
    font-weight: 600;
  }

  /* Tables */
  .table-responsive {
    overflow-x: auto;
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.875rem;
  }

  .admin-table th {
    padding: 0.85rem 1rem;
    color: var(--color-text-muted);
    font-weight: 600;
    font-size: 0.775rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--color-border);
    background: rgba(255, 255, 255, 0.02);
  }

  .admin-table td {
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    vertical-align: middle;
  }

  .admin-table tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }

  .ig-cell {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: #ec4899;
    font-weight: 600;
    text-decoration: none;
    transition: opacity var(--transition-fast);
  }

  .ig-cell:hover {
    text-decoration: underline;
    opacity: 0.85;
  }

  .followers-chip {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    background: rgba(236, 72, 153, 0.1);
    color: #f472b6;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.8rem;
  }

  .category-tag {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    background: rgba(147, 51, 234, 0.15);
    color: #c084fc;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 600;
    margin-left: 0.35rem;
  }

  .action-btn-group {
    display: flex;
    gap: 0.4rem;
  }

  .delete-btn:hover {
    border-color: #ef4444;
    color: #ef4444;
  }

  .log-details-box {
    background: rgba(0, 0, 0, 0.4);
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    max-width: 260px;
    overflow-x: auto;
    color: #cbd5e1;
    margin-bottom: 0.25rem;
  }

  .empty-state {
    padding: 3rem;
    text-align: center;
    color: var(--color-text-muted);
  }

  /* Modals */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 540px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 2rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .modal-header h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #ffffff;
  }

  .modal-sub {
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }

  .modal-close {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
  }

  .modal-close:hover {
    color: #ffffff;
  }

  .modal-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .grid-2-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .input-label {
    font-size: 0.825rem;
    font-weight: 600;
    color: #e2e8f0;
  }

  .input-field {
    width: 100%;
    padding: 0.7rem 0.9rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: #ffffff;
    font-size: 0.875rem;
    outline: none;
    font-family: inherit;
  }

  .input-field:focus {
    border-color: var(--color-primary);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.875rem;
    color: #e2e8f0;
    cursor: pointer;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .text-sub {
    color: var(--color-text-muted);
    font-size: 0.8rem;
  }
</style>
