<script lang="ts">
  import { onMount } from 'svelte';
  import type { Package } from '$types';
  import { fetchPackages } from '$services/api';
  import HeroSection from '$components/HeroSection.svelte';
  import StatsSection from '$components/StatsSection.svelte';
  import PackageCard from '$components/PackageCard.svelte';
  import HowItWorks from '$components/HowItWorks.svelte';
  import FeaturesSection from '$components/FeaturesSection.svelte';
  import FAQSection from '$components/FAQSection.svelte';
  import OrderModal from '$components/OrderModal.svelte';
  import Skeleton from '$components/Skeleton.svelte';
  import { Sparkles, ShieldCheck, ArrowRight, Zap } from 'lucide-svelte';

  let packages: Package[] = [];
  let loadingPackages = true;
  let selectedPackage: Package | null = null;
  let isOrderModalOpen = false;

  onMount(async () => {
    try {
      packages = await fetchPackages();
    } catch (e) {
      console.error('Failed to load packages:', e);
    } finally {
      loadingPackages = false;
    }
  });

  function handleSelectPackage(pkg: Package) {
    selectedPackage = pkg;
    isOrderModalOpen = true;
  }

  function handleOpenOrderModalGeneral() {
    selectedPackage = packages.length > 0 ? packages[0] : null;
    isOrderModalOpen = true;
  }
</script>

<svelte:head>
  <title>Portal Followers - Layanan Pertumbuhan Instagram Modern & Bergaransi</title>
</svelte:head>

<div class="landing-page">
  <!-- 1. Hero Section -->
  <HeroSection
    onOpenCheckOrder={() => {
      const code = prompt('Masukkan ID / Nomor Pesanan Anda (contoh: PF-202609-XXXX):');
      if (code && code.trim()) {
        window.location.href = `/order/${encodeURIComponent(code.trim())}`;
      }
    }}
  />

  <!-- 2. Stats Section -->
  <StatsSection />

  <!-- 3. Packages Section (Database-Driven) -->
  <section id="packages" class="packages-section">
    <div class="container">
      <div class="section-header">
        <div class="badge badge-glow">
          <Sparkles size={12} />
          <span>Pilihan Paket Terlengkap</span>
        </div>
        <h2 class="section-title">Pilihan Paket <span class="text-gradient">Followers Instagram</span></h2>
        <p class="section-desc">
          Pilih paket yang paling sesuai dengan kebutuhan profil Anda. Semua paket diproses otomatis tanpa memerlukan password akun.
        </p>
      </div>

      {#if loadingPackages}
        <div class="packages-grid">
          {#each Array(3) as _}
            <div class="glass-card" style="padding: 2rem; border-radius: var(--radius-xl);">
              <Skeleton height="30px" width="60%" />
              <Skeleton height="45px" width="80%" />
              <Skeleton height="20px" width="100%" />
              <div style="margin: 1.5rem 0;">
                <Skeleton height="60px" width="100%" />
              </div>
              <Skeleton height="15px" width="90%" count={4} />
              <div style="margin-top: 1.5rem;">
                <Skeleton height="45px" width="100%" />
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="packages-grid">
          {#each packages as pkg}
            <PackageCard {pkg} onSelect={handleSelectPackage} />
          {/each}
        </div>
      {/if}

      <!-- Custom Order Banner -->
      <div class="custom-package-card glass-panel">
        <div class="custom-content">
          <div class="custom-badge">
            <Zap size={14} color="#f59e0b" />
            <span>Kebutuhan Khusus / Skala Besar</span>
          </div>
          <h3 class="custom-title">Butuh Paket Custom Lebih dari 10.000 Followers?</h3>
          <p class="custom-desc">
            Kami menyediakan layanan private akselerasi eksklusif untuk agensi, public figure, dan korporasi dengan pengiriman bertahap sesuai jadwal Anda.
          </p>
        </div>
        <button class="btn btn-secondary btn-lg" on:click={handleOpenOrderModalGeneral}>
          <span>Konsultasi / Pesan Custom</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  </section>

  <!-- 4. How It Works -->
  <HowItWorks />

  <!-- 5. Features / Keunggulan -->
  <FeaturesSection />

  <!-- 6. FAQ Section -->
  <FAQSection />

  <!-- 7. Bottom CTA Banner -->
  <section class="bottom-cta-section">
    <div class="container">
      <div class="bottom-cta-card glass-panel">
        <div class="cta-glow"></div>
        <h2 class="cta-title">Siap Menjadikan Akun Instagram Anda <span class="text-gradient">Lebih Populer?</span></h2>
        <p class="cta-desc">
          Tingkatkan kredibilitas profil sekarang juga tanpa menunggu lama. 100% aman dan bergaransi isi ulang 30 hari.
        </p>
        <div class="cta-buttons">
          <button class="btn btn-primary btn-lg" on:click={handleOpenOrderModalGeneral}>
            <span>Pilih Paket & Pesan Sekarang</span>
            <ArrowRight size={18} />
          </button>
          <a href="/packages" class="btn btn-secondary btn-lg">
            <span>Lihat Semua Paket</span>
          </a>
        </div>
      </div>
    </div>
  </section>
</div>

<!-- Order Modal Form -->
<OrderModal
  isOpen={isOrderModalOpen}
  {packages}
  {selectedPackage}
  onClose={() => (isOrderModalOpen = false)}
/>

<style>
  .landing-page {
    position: relative;
  }

  .packages-section {
    padding: 5rem 0;
    position: relative;
  }

  .section-header {
    text-align: center;
    max-width: 640px;
    margin: 0 auto 3.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .section-title {
    font-size: 2.25rem;
    margin: 1rem 0 0.75rem;
    letter-spacing: -0.02em;
  }

  @media (min-width: 640px) {
    .section-title {
      font-size: 2.6rem;
    }
  }

  .section-desc {
    font-size: 0.95rem;
    color: var(--text-secondary);
  }

  .packages-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.75rem;
    align-items: stretch;
    margin-bottom: 3.5rem;
  }

  @media (min-width: 640px) {
    .packages-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .packages-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* Custom Package Banner */
  .custom-package-card {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    align-items: flex-start;
    justify-content: space-between;
    padding: 2.25rem;
    border-radius: var(--radius-xl);
    border: 1px solid rgba(245, 158, 11, 0.25);
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(18, 22, 34, 0.9) 100%);
  }

  @media (min-width: 900px) {
    .custom-package-card {
      flex-direction: row;
      align-items: center;
    }
  }

  .custom-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #fbbf24;
    margin-bottom: 0.5rem;
  }

  .custom-title {
    font-size: 1.35rem;
    margin-bottom: 0.4rem;
    color: #ffffff;
  }

  .custom-desc {
    font-size: 0.88rem;
    color: var(--text-secondary);
    max-width: 600px;
    line-height: 1.5;
  }

  /* Bottom CTA Banner */
  .bottom-cta-section {
    padding: 3rem 0 6rem;
  }

  .bottom-cta-card {
    text-align: center;
    padding: 4rem 2rem;
    border-radius: var(--radius-xl);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid rgba(236, 72, 153, 0.3);
    background: linear-gradient(180deg, rgba(236, 72, 153, 0.08) 0%, rgba(14, 18, 28, 0.95) 100%);
  }

  .cta-glow {
    position: absolute;
    top: -50%;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 300px;
    background: radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%);
    pointer-events: none;
  }

  .cta-title {
    font-size: 2.2rem;
    margin-bottom: 1rem;
    letter-spacing: -0.02em;
    max-width: 700px;
  }

  @media (min-width: 640px) {
    .cta-title {
      font-size: 2.8rem;
    }
  }

  .cta-desc {
    font-size: 1rem;
    color: var(--text-secondary);
    max-width: 580px;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .cta-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
  }
</style>
