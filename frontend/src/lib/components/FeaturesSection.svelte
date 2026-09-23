<script lang="ts">
  import { ShieldCheck, Zap, Lock, RefreshCw, Headphones, TrendingUp, Sparkles } from 'lucide-svelte';

  const features = [
    {
      icon: Lock,
      title: '100% Tanpa Password',
      desc: 'Keamanan akun adalah prioritas tertinggi. Kami hanya membutuhkan username Instagram publik Anda.',
      color: '#ec4899',
    },
    {
      icon: RefreshCw,
      title: 'Garansi Refill 30 Hari',
      desc: 'Perlindungan ekstra jika terjadi penurunan alami (drop) dengan sistem isi ulang otomatis tanpa biaya tambahan.',
      color: '#10b981',
    },
    {
      icon: TrendingUp,
      title: 'Pengiriman Natural & Bertahap',
      desc: 'Followers masuk secara bertahap dan konsisten sehingga selaras dengan algoritma rekomendasi Instagram.',
      color: '#f59e0b',
    },
    {
      icon: Zap,
      title: 'Sistem Otomatis 24 Jam',
      desc: 'Pesanan langsung diproses otomatis oleh sistem segera setelah pembayaran terkonfirmasi.',
      color: '#06b6d4',
    },
    {
      icon: ShieldCheck,
      title: 'Privasi Data Pelanggan',
      desc: 'Identitas, email, dan transaksi Anda dienkripsi serta tidak akan pernah dibagikan ke pihak ketiga mana pun.',
      color: '#8b5cf6',
    },
    {
      icon: Headphones,
      title: 'Dukungan CS 24/7',
      desc: 'Tim Customer Support kami siap membantu pertanyaan dan keluhan Anda setiap hari tanpa libur.',
      color: '#f43f5e',
    },
  ];
</script>

<section id="features" class="features-section">
  <div class="container">
    <div class="section-header">
      <div class="badge badge-glow">
        <Sparkles size={12} />
        <span>Kenapa Memilih Kami</span>
      </div>
      <h2 class="section-title">Keunggulan Layanan <span class="text-gradient">Portal Followers</span></h2>
      <p class="section-desc">Platform andalan kreator, selebgram, dan pemilik bisnis online di seluruh Indonesia.</p>
    </div>

    <div class="features-grid">
      {#each features as feat}
        <div class="glass-card feature-card">
          <div class="feat-icon-box" style="background: {feat.color}15; border-color: {feat.color}35;">
            <svelte:component this={feat.icon} size={24} color={feat.color} />
          </div>
          <h3 class="feat-title">{feat.title}</h3>
          <p class="feat-desc">{feat.desc}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .features-section {
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

  .features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 640px) {
    .features-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .features-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .feature-card {
    padding: 2rem 1.75rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .feat-icon-box {
    width: 50px;
    height: 50px;
    border-radius: var(--radius-md);
    border: 1px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.25rem;
  }

  .feat-title {
    font-size: 1.15rem;
    color: #ffffff;
    margin-bottom: 0.6rem;
  }

  .feat-desc {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.6;
  }
</style>
