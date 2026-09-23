<script lang="ts">
  import { Users, ShieldCheck, Zap, Award } from 'lucide-svelte';

  const stats = [
    {
      icon: Users,
      value: '2.5M+',
      label: 'Followers Terkirim',
      desc: 'Dialokasikan secara aman & bertahap ke akun klien',
      color: '#ec4899',
    },
    {
      icon: Award,
      value: '99.8%',
      label: 'Tingkat Kepuasan',
      desc: 'Rating bintang 5 dari 14.000+ kreator & UMKM',
      color: '#f59e0b',
    },
    {
      icon: Zap,
      value: '< 10 Menit',
      label: 'Kecepatan Proses',
      desc: 'Sistem otomatis memproses order segera setelah bayar',
      color: '#06b6d4',
    },
    {
      icon: ShieldCheck,
      value: '100% Aman',
      label: 'Privasi Terlindungi',
      desc: 'Tanpa login, tanpa password, dan tanpa risiko suspend',
      color: '#10b981',
    },
  ];
</script>

<section class="stats-section">
  <div class="container">
    <div class="stats-grid">
      {#each stats as item}
        <div class="glass-card stat-card">
          <div class="stat-icon-wrapper" style="background: {item.color}15; border-color: {item.color}35;">
            <svelte:component this={item.icon} size={24} color={item.color} />
          </div>
          <div class="stat-info">
            <h3 class="stat-value">{item.value}</h3>
            <p class="stat-label">{item.label}</p>
            <p class="stat-desc">{item.desc}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .stats-section {
    padding: 1rem 0 4rem;
    position: relative;
    z-index: 2;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  @media (min-width: 640px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .stat-card {
    padding: 1.75rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.25rem;
    position: relative;
    overflow: hidden;
  }

  .stat-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    border: 1px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 1.85rem;
    font-weight: 800;
    font-family: var(--font-display);
    color: #ffffff;
    margin-bottom: 0.25rem;
    letter-spacing: -0.02em;
  }

  .stat-label {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.35rem;
  }

  .stat-desc {
    font-size: 0.8rem;
    color: var(--text-muted);
    line-height: 1.4;
  }
</style>
