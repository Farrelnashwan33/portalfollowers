<script lang="ts">
  import { auth } from '$stores/authStore';
  import { Instagram, Search, ShieldCheck, User, Menu, X, LogOut, LayoutDashboard, Shield } from 'lucide-svelte';
  import { toast } from '$stores/toastStore';

  let mobileMenuOpen = false;
  let checkOrderModalOpen = false;
  let orderCodeInput = '';

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function handleCheckOrderSubmit() {
    const trimmed = orderCodeInput.trim();
    if (!trimmed) {
      toast.warning('Masukkan nomor pesanan terlebih dahulu');
      return;
    }
    checkOrderModalOpen = false;
    window.location.href = `/order/${encodeURIComponent(trimmed)}`;
  }
</script>

<header class="navbar-wrapper">
  <div class="container navbar-container">
    <!-- Brand Logo -->
    <a href="/" class="brand-logo">
      <div class="logo-icon">
        <Instagram size={22} color="#ffffff" />
      </div>
      <span class="logo-text">Portal<span class="text-gradient">Followers</span></span>
    </a>

    <!-- Desktop Navigation -->
    <nav class="desktop-nav">
      <a href="/" class="nav-link">Beranda</a>
      <a href="/packages" class="nav-link">Paket Followers</a>
      <a href="/#how-it-works" class="nav-link">Cara Kerja</a>
      <a href="/#features" class="nav-link">Keunggulan</a>
      <a href="/#faq" class="nav-link">FAQ</a>
    </nav>

    <!-- Desktop Action Buttons -->
    <div class="desktop-actions">
      <button class="btn btn-secondary btn-sm" on:click={() => (checkOrderModalOpen = true)}>
        <Search size={15} />
        <span>Cek Pesanan</span>
      </button>

      {#if $auth.user}
        {#if $auth.isAdmin}
          <a href="/admin" class="btn btn-secondary btn-sm admin-btn">
            <Shield size={15} color="#ec4899" />
            <span>Admin</span>
          </a>
        {/if}
        <a href="/dashboard" class="btn btn-secondary btn-sm">
          <LayoutDashboard size={15} />
          <span>Dashboard</span>
        </a>
        <button
          class="btn-icon"
          on:click={async () => {
            await auth.signOut();
            toast.info('Anda telah keluar dari akun');
          }}
          title="Keluar"
        >
          <LogOut size={16} />
        </button>
      {:else}
        <a href="/login" class="nav-link login-link">Masuk</a>
        <a href="/packages" class="btn btn-primary btn-sm">
          <span>Mulai Sekarang</span>
        </a>
      {/if}
    </div>

    <!-- Mobile Hamburger Toggle -->
    <button class="mobile-toggle" on:click={toggleMobileMenu} aria-label="Toggle navigation menu">
      {#if mobileMenuOpen}
        <X size={24} />
      {:else}
        <Menu size={24} />
      {/if}
    </button>
  </div>

  <!-- Mobile Drawer Menu -->
  {#if mobileMenuOpen}
    <div class="mobile-drawer animate-fade-in">
      <div class="mobile-drawer-links">
        <a href="/" class="mobile-nav-link" on:click={() => (mobileMenuOpen = false)}>Beranda</a>
        <a href="/packages" class="mobile-nav-link" on:click={() => (mobileMenuOpen = false)}>Paket Followers</a>
        <a href="/#how-it-works" class="mobile-nav-link" on:click={() => (mobileMenuOpen = false)}>Cara Kerja</a>
        <a href="/#features" class="mobile-nav-link" on:click={() => (mobileMenuOpen = false)}>Keunggulan</a>
        <a href="/#faq" class="mobile-nav-link" on:click={() => (mobileMenuOpen = false)}>FAQ</a>

        <hr class="drawer-divider" />

        <button
          class="btn btn-secondary w-full"
          on:click={() => {
            mobileMenuOpen = false;
            checkOrderModalOpen = true;
          }}
        >
          <Search size={16} />
          <span>Cek Pesanan</span>
        </button>

        {#if $auth.user}
          {#if $auth.isAdmin}
            <a href="/admin" class="btn btn-secondary w-full" on:click={() => (mobileMenuOpen = false)}>
              <Shield size={16} color="#ec4899" />
              <span>Admin Dashboard</span>
            </a>
          {/if}
          <a href="/dashboard" class="btn btn-secondary w-full" on:click={() => (mobileMenuOpen = false)}>
            <LayoutDashboard size={16} />
            <span>User Dashboard</span>
          </a>
          <button
            class="btn btn-outline w-full"
            on:click={async () => {
              mobileMenuOpen = false;
              await auth.signOut();
              toast.info('Anda telah keluar dari akun');
            }}
          >
            <LogOut size={16} />
            <span>Keluar Akun</span>
          </button>
        {:else}
          <div class="mobile-auth-grid">
            <a href="/login" class="btn btn-secondary" on:click={() => (mobileMenuOpen = false)}>Masuk</a>
            <a href="/packages" class="btn btn-primary" on:click={() => (mobileMenuOpen = false)}>Mulai Order</a>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</header>

<!-- Modal Cek Pesanan Cepat -->
{#if checkOrderModalOpen}
  <div class="modal-backdrop animate-fade-in" on:click|self={() => (checkOrderModalOpen = false)}>
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-icon-badge">
          <Search size={20} color="#ec4899" />
        </div>
        <div>
          <h3>Lacak Status Pesanan</h3>
          <p class="modal-sub">Masukkan ID Pesanan untuk melihat progress layanan real-time</p>
        </div>
        <button class="modal-close" on:click={() => (checkOrderModalOpen = false)}>
          <X size={18} />
        </button>
      </div>

      <form on:submit|preventDefault={handleCheckOrderSubmit} class="modal-form">
        <div class="form-group">
          <label for="modal-order-input" class="input-label">Nomor / ID Pesanan</label>
          <input
            id="modal-order-input"
            type="text"
            class="input-field"
            placeholder="Contoh: PF-202609-A1B2C3"
            bind:value={orderCodeInput}
            required
            autocomplete="off"
          />
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" on:click={() => (checkOrderModalOpen = false)}>
            Batal
          </button>
          <button type="submit" class="btn btn-primary">
            <span>Periksa Status</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .navbar-wrapper {
    position: sticky;
    top: 0;
    z-index: 50;
    width: 100%;
    background: rgba(7, 9, 14, 0.82);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-subtle);
    transition: all 0.3s ease;
  }

  .navbar-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 72px;
  }

  .brand-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .logo-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--gradient-ig);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(236, 72, 153, 0.35);
  }

  .logo-text {
    font-family: var(--font-display);
    color: #ffffff;
  }

  .desktop-nav {
    display: none;
    align-items: center;
    gap: 1.75rem;
  }

  @media (min-width: 900px) {
    .desktop-nav {
      display: flex;
    }
  }

  .nav-link {
    font-size: 0.92rem;
    font-weight: 500;
    color: var(--text-secondary);
    transition: color 0.2s ease;
  }

  .nav-link:hover {
    color: #ffffff;
  }

  .desktop-actions {
    display: none;
    align-items: center;
    gap: 0.85rem;
  }

  @media (min-width: 768px) {
    .desktop-actions {
      display: flex;
    }
  }

  .login-link {
    padding: 0.5rem 0.75rem;
  }

  .btn-icon {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-subtle);
    color: var(--text-secondary);
    padding: 0.55rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .btn-icon:hover {
    color: var(--accent-rose);
    border-color: rgba(244, 63, 94, 0.4);
    background: rgba(244, 63, 94, 0.1);
  }

  .mobile-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    padding: 0.5rem;
  }

  @media (min-width: 900px) {
    .mobile-toggle {
      display: none;
    }
  }

  /* Mobile Drawer */
  .mobile-drawer {
    position: absolute;
    top: 72px;
    left: 0;
    width: 100%;
    background: rgba(10, 13, 20, 0.98);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-subtle);
    padding: 1.5rem;
    box-shadow: var(--shadow-lg);
  }

  .mobile-drawer-links {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .mobile-nav-link {
    font-size: 1.05rem;
    font-weight: 500;
    color: var(--text-primary);
    padding: 0.4rem 0;
  }

  .drawer-divider {
    border: none;
    border-top: 1px solid var(--border-subtle);
    margin: 0.5rem 0;
  }

  .mobile-auth-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .w-full {
    width: 100%;
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.25rem;
  }

  .modal-card {
    background: rgba(18, 22, 34, 0.96);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xl);
    width: 100%;
    max-width: 480px;
    padding: 1.75rem;
    box-shadow: var(--shadow-lg);
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
    position: relative;
  }

  .modal-icon-badge {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba(236, 72, 153, 0.12);
    border: 1px solid rgba(236, 72, 153, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .modal-header h3 {
    font-size: 1.15rem;
    margin-bottom: 0.25rem;
  }

  .modal-sub {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .modal-close {
    position: absolute;
    top: 0;
    right: 0;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
  }

  .modal-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }
</style>
