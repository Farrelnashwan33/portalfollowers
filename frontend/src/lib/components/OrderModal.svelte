<script lang="ts">
  import type { Package, PackageCategory } from '$types';
  import { auth } from '$stores/authStore';
  import { toast } from '$stores/toastStore';
  import { createOrder } from '$services/api';
  import { formatCurrency, formatNumber, cleanInstagramUsername } from '$utils/formatters';
  import { X, Instagram, ShieldCheck, Zap, Lock, CreditCard, Sparkles, AlertCircle, Globe, Flag, Tag } from 'lucide-svelte';

  export let selectedPackage: Package | null = null;
  export let packages: Package[] = [];
  export let isOpen: boolean = false;
  export let onClose: () => void;

  let customerName = '';
  let customerEmail = '';
  let instagramUsername = '';
  let selectedPackageId = '';
  let paymentMethod = 'xendit';
  let customerNote = '';
  let isSubmitting = false;
  let activeCategory: 'ALL' | PackageCategory = 'ALL';

  // Pre-fill user data if logged in
  $: if ($auth.user) {
    if (!customerEmail) customerEmail = $auth.user.email || '';
    if (!customerName && $auth.profile?.full_name) customerName = $auth.profile.full_name;
  }

  $: filteredPackages = packages.filter((p) => {
    if (activeCategory === 'ALL') return p.category !== 'PROMOTION_FREE';
    return p.category === activeCategory;
  });

  $: if (selectedPackage) {
    selectedPackageId = selectedPackage.id;
  } else if (filteredPackages.length > 0 && !selectedPackageId) {
    selectedPackageId = filteredPackages[0].id;
  }

  $: currentPkg = packages.find((p) => p.id === selectedPackageId) || selectedPackage || packages[0];
  $: cleanedUsername = cleanInstagramUsername(instagramUsername);

  async function handleOrderSubmit() {
    if (!cleanedUsername) {
      toast.error('Silakan masukkan username Instagram target.');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Silakan isi nama lengkap pemesan.');
      return;
    }

    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      toast.error('Silakan isi alamat email yang valid untuk pengiriman invoice.');
      return;
    }

    if (!currentPkg) {
      toast.error('Silakan pilih paket followers.');
      return;
    }

    isSubmitting = true;
    try {
      const response = await createOrder({
        packageId: currentPkg.id,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        instagramUsername: cleanedUsername,
        paymentMethod,
        customerNote: customerNote.trim() || undefined,
        userId: $auth.user?.id || null,
      });

      if (response.success && response.data) {
        toast.success(`Pesanan #${response.data.order_code} berhasil dibuat!`);
        onClose();
        
        // If Xendit invoice URL is present, redirect to checkout or order tracking
        if (response.data.xendit_payment_url) {
          window.location.href = `/order/${response.data.order_code}`;
        } else {
          window.location.href = `/order/${response.data.order_code}`;
        }
      } else {
        toast.error(response.error || 'Gagal memproses pesanan. Silakan coba lagi.');
      }
    } catch (e: any) {
      toast.error('Terjadi kesalahan jaringan. Silakan periksa koneksi Anda.');
    } finally {
      isSubmitting = false;
    }
  }
</script>

{#if isOpen && currentPkg}
  <div class="modal-backdrop animate-fade-in" on:click|self={onClose}>
    <div class="modal-container">
      <div class="modal-header">
        <div class="header-icon-box">
          <Instagram size={24} color="#ffffff" />
        </div>
        <div>
          <h2 class="modal-title">Form Pemesanan Followers</h2>
          <p class="modal-subtitle">Layanan resmi, aman & otomatis tanpa password</p>
        </div>
        <button class="close-btn" on:click={onClose} aria-label="Tutup form">
          <X size={20} />
        </button>
      </div>

      <!-- Safety Notice -->
      <div class="safety-banner">
        <ShieldCheck size={18} color="#10b981" />
        <p>
          <strong>Keamanan Terjamin:</strong> Kami <strong>TIDAK PERNAH</strong> meminta password, kode OTP, atau login ke akun Instagram Anda.
        </p>
      </div>

      <form on:submit|preventDefault={handleOrderSubmit} class="order-form">
        <!-- Category Filter Tabs inside modal -->
        <div class="category-tabs">
          <button
            type="button"
            class="cat-tab-btn {activeCategory === 'ALL' ? 'cat-tab-active' : ''}"
            on:click={() => {
              activeCategory = 'ALL';
              if (filteredPackages.length > 0) selectedPackageId = filteredPackages[0].id;
            }}
          >
            Semua
          </button>
          <button
            type="button"
            class="cat-tab-btn {activeCategory === 'INDONESIA' ? 'cat-tab-active' : ''}"
            on:click={() => {
              activeCategory = 'INDONESIA';
              const first = packages.find((p) => p.category === 'INDONESIA');
              if (first) selectedPackageId = first.id;
            }}
          >
            🇮🇩 Indonesia
          </button>
          <button
            type="button"
            class="cat-tab-btn {activeCategory === 'INTERNATIONAL' ? 'cat-tab-active' : ''}"
            on:click={() => {
              activeCategory = 'INTERNATIONAL';
              const first = packages.find((p) => p.category === 'INTERNATIONAL');
              if (first) selectedPackageId = first.id;
            }}
          >
            🌐 Internasional
          </button>
          <button
            type="button"
            class="cat-tab-btn {activeCategory === 'PROMOTION_PAID' ? 'cat-tab-active' : ''}"
            on:click={() => {
              activeCategory = 'PROMOTION_PAID';
              const first = packages.find((p) => p.category === 'PROMOTION_PAID');
              if (first) selectedPackageId = first.id;
            }}
          >
            ⚡ Promo
          </button>
        </div>

        <!-- Package Selection Box -->
        <div class="form-group">
          <label for="package-select" class="input-label">Pilih Paket Followers</label>
          <select id="package-select" class="input-field select-field" bind:value={selectedPackageId}>
            {#each filteredPackages as p}
              <option value={p.id}>
                {p.name} - {formatNumber(p.followers)} Followers ({formatCurrency(p.price)})
              </option>
            {/each}
          </select>
        </div>

        <!-- Instagram Username -->
        <div class="form-group">
          <label for="ig-username-input" class="input-label">
            Username Instagram Target <span class="required-star">*</span>
          </label>
          <div class="input-with-icon">
            <span class="input-prefix">@</span>
            <input
              id="ig-username-input"
              type="text"
              class="input-field input-has-prefix"
              placeholder="username_kamu"
              bind:value={instagramUsername}
              required
              autocomplete="off"
            />
          </div>
          {#if cleanedUsername}
            <div class="ig-preview-link">
              <span>Target Profil:</span>
              <a href="https://www.instagram.com/{cleanedUsername}/" target="_blank" rel="noopener noreferrer">
                instagram.com/{cleanedUsername} ↗
              </a>
            </div>
          {/if}
          <p class="input-help">Pastikan profil Instagram <strong>TIDAK DI-PRIVATE</strong> selama proses berlangsung.</p>
        </div>

        <!-- Customer Name & Email -->
        <div class="grid-2-col">
          <div class="form-group">
            <label for="cust-name-input" class="input-label">Nama Pemesan <span class="required-star">*</span></label>
            <input
              id="cust-name-input"
              type="text"
              class="input-field"
              placeholder="Farrel Nashwan"
              bind:value={customerName}
              required
            />
          </div>
          <div class="form-group">
            <label for="cust-email-input" class="input-label">Email Aktif (Invoice) <span class="required-star">*</span></label>
            <input
              id="cust-email-input"
              type="email"
              class="input-field"
              placeholder="farrel@example.com"
              bind:value={customerEmail}
              required
            />
          </div>
        </div>

        <!-- Payment Method Selection -->
        <div class="form-group">
          <label class="input-label">Metode Pembayaran (Xendit Gateway)</label>
          <div class="payment-selector-grid">
            <label class="payment-option selected-payment">
              <input type="radio" name="paymentMethod" value="xendit" checked />
              <div class="pay-info">
                <span class="pay-name">Xendit Official Gateway</span>
                <span class="pay-desc">QRIS, BCA, Mandiri, BNI, BRI, OVO, DANA, ShopeePay</span>
              </div>
              <span class="pay-tag">Instan & Otomatis</span>
            </label>
          </div>
        </div>

        <!-- Customer Note (Optional) -->
        <div class="form-group">
          <label for="cust-note-input" class="input-label">Catatan Tambahan (Opsional)</label>
          <input
            id="cust-note-input"
            type="text"
            class="input-field"
            placeholder="Contoh: Kirim bertahap secara natural"
            bind:value={customerNote}
          />
        </div>

        <!-- Order Summary Box -->
        <div class="order-summary-card">
          <div class="summary-row">
            <span class="summary-label">Paket Dipilih:</span>
            <span class="summary-value font-semibold">{currentPkg.name} ({formatNumber(currentPkg.followers)} Followers)</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Kategori Layanan:</span>
            <span class="summary-value">{currentPkg.category || 'INDONESIA'}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Estimasi Pemrosesan:</span>
            <span class="summary-value">{currentPkg.estimated_time || '1–5 Menit'}</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-row total-row">
            <span class="summary-label text-white">Total Pembayaran:</span>
            <span class="summary-value total-price text-gradient">{formatCurrency(currentPkg.price)}</span>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" on:click={onClose} disabled={isSubmitting}>
            Batal
          </button>
          <button type="submit" class="btn btn-primary submit-btn" disabled={isSubmitting}>
            {#if isSubmitting}
              <span class="spinner"></span>
              <span>Memproses Transaksi Xendit...</span>
            {:else}
              <Zap size={18} />
              <span>Bayar Sekarang ({formatCurrency(currentPkg.price)})</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    z-index: 1000;
  }

  .modal-container {
    background: #0f172a;
    border: 1px solid var(--border-glow);
    border-radius: var(--radius-2xl);
    width: 100%;
    max-width: 580px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 2.25rem;
    box-shadow: var(--shadow-2xl);
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .header-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--gradient-ig);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .modal-title {
    font-size: 1.35rem;
    color: #ffffff;
    margin-bottom: 0.2rem;
  }

  .modal-subtitle {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .close-btn {
    margin-left: auto;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 6px;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: #ffffff;
  }

  .safety-banner {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    margin-bottom: 1.5rem;
    font-size: 0.82rem;
    color: #34d399;
    line-height: 1.4;
  }

  .order-form {
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
  }

  .category-tabs {
    display: flex;
    gap: 0.4rem;
    background: rgba(255, 255, 255, 0.03);
    padding: 0.3rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-subtle);
  }

  .cat-tab-btn {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    padding: 0.45rem 0.6rem;
    border-radius: var(--radius-sm);
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .cat-tab-btn:hover {
    color: #ffffff;
  }

  .cat-tab-active {
    background: var(--gradient-ig);
    color: #ffffff !important;
    font-weight: 700;
  }

  .required-star {
    color: #f43f5e;
  }

  .input-with-icon {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-prefix {
    position: absolute;
    left: 1rem;
    font-weight: 700;
    color: var(--ig-pink);
    font-size: 1.05rem;
  }

  .input-has-prefix {
    padding-left: 2.2rem;
    font-family: var(--font-display);
    font-weight: 600;
  }

  .ig-preview-link {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 0.35rem;
  }

  .ig-preview-link a {
    color: var(--ig-pink);
    font-weight: 600;
  }

  .ig-preview-link a:hover {
    text-decoration: underline;
  }

  .input-help {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.3rem;
  }

  .grid-2-col {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  @media (min-width: 640px) {
    .grid-2-col {
      grid-template-columns: 1fr 1fr;
    }
  }

  .payment-selector-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .payment-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid var(--border-subtle);
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s;
  }

  .selected-payment {
    border-color: var(--ig-pink);
    background: rgba(236, 72, 153, 0.08);
  }

  .pay-info {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .pay-name {
    font-size: 0.88rem;
    font-weight: 600;
    color: #ffffff;
  }

  .pay-desc {
    font-size: 0.74rem;
    color: var(--text-muted);
  }

  .pay-tag {
    font-size: 0.7rem;
    font-weight: 700;
    color: #34d399;
    background: rgba(16, 185, 129, 0.12);
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-sm);
  }

  .order-summary-card {
    background: rgba(10, 14, 22, 0.7);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: 1.25rem;
    margin: 0.5rem 0;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.86rem;
    margin-bottom: 0.5rem;
  }

  .summary-label {
    color: var(--text-secondary);
  }

  .summary-value {
    color: #ffffff;
  }

  .summary-divider {
    height: 1px;
    background: var(--border-subtle);
    margin: 0.75rem 0;
  }

  .total-row {
    margin-bottom: 0;
    font-size: 1rem;
    align-items: center;
  }

  .total-price {
    font-size: 1.35rem;
    font-weight: 800;
    font-family: var(--font-display);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .submit-btn {
    flex: 1;
  }

  @media (min-width: 640px) {
    .submit-btn {
      flex: initial;
      min-width: 260px;
    }
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
