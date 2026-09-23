<script lang="ts">
  import { onMount } from 'svelte';
  import type { Package } from '$types';
  import { fetchPackages } from '$services/api';
  import PackageCard from '$components/PackageCard.svelte';
  import OrderModal from '$components/OrderModal.svelte';
  import Skeleton from '$components/Skeleton.svelte';
  import { Sparkles, Search, Filter, ShieldCheck, Zap } from 'lucide-svelte';

  let packages: Package[] = [];
  let loading = true;
  let searchQuery = '';
  let selectedBadgeFilter = 'all';
  let selectedPackage: Package | null = null;
  let isOrderModalOpen = false;

  onMount(async () => {
    try {
      packages = await fetchPackages();
    } catch (e) {
      console.error('Error fetching packages:', e);
    } finally {
      loading = false;
    }
  });

  $: filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.followers.toString().includes(searchQuery) ||
      (pkg.description && pkg.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBadge =
      selectedBadgeFilter === 'all' ||
      (selectedBadgeFilter === 'popular' && (pkg.badge === 'Paling Populer' || pkg.badge === 'Best Value')) ||
      (selectedBadgeFilter === 'starter' && pkg.followers <= 500) ||
      (selectedBadgeFilter === 'scale' && pkg.followers >= 2500);

    return matchesSearch && matchesBadge;
  });

  function handleSelect(pkg: Package) {
    selectedPackage = pkg;
    isOrderModalOpen = true;
  }
</script>

<svelte:head>
  <title>Daftar Paket Followers Instagram - Portal Followers</title>
</svelte:head>

<div class="packages-page">
  <div class="container">
    <!-- Header -->
    <div class="page-header">
      <div class="badge badge-glow">
        <Sparkles size={12} />
        <span>Katalog Layanan</span>
      </div>
      <h1 class="page-title">Pilihan Paket <span class="text-gradient">Followers Instagram</span></h1>
      <p class="page-desc">
        Tingkatkan kredibilitas profil dengan pengiriman followers bertahap, bergaransi, dan 100% aman tanpa password.
      </p>

      <!-- Search & Filters -->
      <div class="filters-bar glass-panel">
        <div class="search-input-box">
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            class="filter-search-input"
            placeholder="Cari paket atau jumlah followers (cth: 1000)..."
            bind:value={searchQuery}
          />
        </div>

        <div class="filter-pills">
          <button
            class="filter-pill {selectedBadgeFilter === 'all' ? 'active-pill' : ''}"
            on:click={() => (selectedBadgeFilter = 'all')}
          >
            Semua Paket ({packages.length})
          </button>
          <button
            class="filter-pill {selectedBadgeFilter === 'popular' ? 'active-pill' : ''}"
            on:click={() => (selectedBadgeFilter = 'popular')}
          >
            Paling Populer ⭐
          </button>
          <button
            class="filter-pill {selectedBadgeFilter === 'starter' ? 'active-pill' : ''}"
            on:click={() => (selectedBadgeFilter = 'starter')}
          >
            Pemula (100 - 500)
          </button>
          <button
            class="filter-pill {selectedBadgeFilter === 'scale' ? 'active-pill' : ''}"
            on:click={() => (selectedBadgeFilter = 'scale')}
          >
            Skala Besar (2.5K+)
          </button>
        </div>
      </div>
    </div>

    <!-- Grid of Packages -->
    {#if loading}
      <div class="catalog-grid">
        {#each Array(6) as _}
          <div class="glass-card" style="padding: 2rem; border-radius: var(--radius-xl);">
            <Skeleton height="30px" width="60%" />
            <Skeleton height="45px" width="80%" />
            <Skeleton height="20px" width="100%" />
            <div style="margin: 1.5rem 0;">
              <Skeleton height="60px" width="100%" />
            </div>
            <Skeleton height="15px" width="90%" count={4} />
          </div>
        {/each}
      </div>
    {:else if filteredPackages.length === 0}
      <div class="empty-state glass-panel">
        <p class="empty-text">Tidak ada paket yang sesuai dengan pencarian "{searchQuery}".</p>
        <button class="btn btn-secondary" on:click={() => { searchQuery = ''; selectedBadgeFilter = 'all'; }}>
          Reset Filter
        </button>
      </div>
    {:else}
      <div class="catalog-grid">
        {#each filteredPackages as pkg}
          <PackageCard {pkg} onSelect={handleSelect} />
        {/each}
      </div>
    {/if}
  </div>
</div>

<OrderModal
  isOpen={isOrderModalOpen}
  {packages}
  {selectedPackage}
  onClose={() => (isOrderModalOpen = false)}
/>

<style>
  .packages-page {
    padding: 3.5rem 0 6rem;
  }

  .page-header {
    text-align: center;
    max-width: 800px;
    margin: 0 auto 3.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .page-title {
    font-size: 2.4rem;
    margin: 1rem 0 0.75rem;
    letter-spacing: -0.02em;
  }

  @media (min-width: 640px) {
    .page-title {
      font-size: 3rem;
    }
  }

  .page-desc {
    font-size: 1rem;
    color: var(--text-secondary);
    margin-bottom: 2rem;
  }

  .filters-bar {
    width: 100%;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  @media (min-width: 768px) {
    .filters-bar {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  .search-input-box {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(10, 14, 22, 0.8);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 0.6rem 1rem;
    flex: 1;
    max-width: 400px;
  }

  .filter-search-input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-size: 0.9rem;
    width: 100%;
  }

  .filter-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .filter-pill {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border-subtle);
    color: var(--text-secondary);
    padding: 0.45rem 0.9rem;
    border-radius: var(--radius-full);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .filter-pill:hover {
    color: var(--text-primary);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .active-pill {
    background: rgba(236, 72, 153, 0.15);
    border-color: var(--ig-pink);
    color: #f472b6;
  }

  .catalog-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }

  @media (min-width: 640px) {
    .catalog-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .catalog-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
  }

  .empty-text {
    color: var(--text-secondary);
    font-size: 1rem;
  }
</style>
