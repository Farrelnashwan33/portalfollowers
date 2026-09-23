<script lang="ts">
  import { Package, UserCheck, Zap, Sparkles } from 'lucide-svelte';

  const steps = [
    {
      step: '01',
      title: 'Pilih Paket Followers',
      desc: 'Tentukan jumlah followers yang sesuai dengan target pertumbuhan dan anggaran profil Anda.',
      icon: Package,
      color: '#ec4899',
    },
    {
      step: '02',
      title: 'Ketik Username Instagram',
      desc: 'Cukup masukkan username Instagram publik Anda. Kami sama sekali TIDAK memerlukan password akun.',
      icon: UserCheck,
      color: '#8b5cf6',
    },
    {
      step: '03',
      title: 'Pembayaran & Live Tracking',
      desc: 'Bayar otomatis melalui QRIS atau transfer bank. Pantau progress followers masuk secara real-time.',
      icon: Zap,
      color: '#f59e0b',
    },
  ];
</script>

<section id="how-it-works" class="how-section">
  <div class="container">
    <div class="section-header">
      <div class="badge badge-glow">
        <Sparkles size={12} />
        <span>Mudah & Cepat</span>
      </div>
      <h2 class="section-title">Cara Pemesanan di <span class="text-gradient">Portal Followers</span></h2>
      <p class="section-desc">Hanya butuh 3 langkah praktis kurang dari 1 menit untuk memulai akselerasi akun Anda.</p>
    </div>

    <div class="steps-grid">
      {#each steps as item, idx}
        <div class="step-card glass-card">
          <div class="step-number" style="color: {item.color};">{item.step}</div>
          <div class="step-icon-box" style="background: {item.color}15; border-color: {item.color}35;">
            <svelte:component this={item.icon} size={28} color={item.color} />
          </div>
          <h3 class="step-title">{item.title}</h3>
          <p class="step-desc">{item.desc}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .how-section {
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

  .steps-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .steps-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .step-card {
    padding: 2.25rem 1.75rem;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .step-number {
    position: absolute;
    top: 1.5rem;
    right: 1.75rem;
    font-size: 2rem;
    font-family: var(--font-display);
    font-weight: 900;
    opacity: 0.25;
  }

  .step-icon-box {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-md);
    border: 1px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .step-title {
    font-size: 1.2rem;
    margin-bottom: 0.75rem;
    color: #ffffff;
  }

  .step-desc {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.6;
  }
</style>
