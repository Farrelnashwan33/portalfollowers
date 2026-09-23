<script lang="ts">
  import { ShieldCheck, Zap, ArrowRight, Search, CheckCircle2, TrendingUp, Sparkles, Star } from 'lucide-svelte';

  export let onOpenCheckOrder: () => void = () => {};
</script>

<section class="hero-section">
  <!-- Glowing Background Orbs -->
  <div class="glow-orb orb-1"></div>
  <div class="glow-orb orb-2"></div>

  <div class="container hero-container">
    <div class="hero-content">
      <!-- Announcement Tag -->
      <div class="hero-badge animate-fade-in">
        <span class="badge-dot"></span>
        <Sparkles size={14} color="#f472b6" />
        <span>Platform Pertumbuhan Instagram #1 Tanpa Password</span>
      </div>

      <!-- Main Headline -->
      <h1 class="hero-title">
        Grow Your Instagram <span class="text-gradient">Faster & Safer</span>
      </h1>

      <!-- Description -->
      <p class="hero-desc">
        Akselerasi popularitas profil, tingkatkan engagement, dan bangun kredibilitas brand Anda secara instan. Pengiriman natural, bergaransi isi ulang, dan <strong>100% aman tanpa memerlukan password akun</strong>.
      </p>

      <!-- CTA Buttons -->
      <div class="hero-ctas">
        <a href="#packages" class="btn btn-primary btn-lg">
          <span>Mulai Sekarang</span>
          <ArrowRight size={18} />
        </a>
        <button class="btn btn-secondary btn-lg" on:click={onOpenCheckOrder}>
          <Search size={18} />
          <span>Cek Pesanan</span>
        </button>
      </div>

      <!-- Micro Trust Indicators -->
      <div class="trust-list">
        <div class="trust-item">
          <ShieldCheck size={17} color="#10b981" />
          <span>Tanpa Password Akun</span>
        </div>
        <div class="trust-item">
          <Zap size={17} color="#f59e0b" />
          <span>Proses Instan & Otomatis</span>
        </div>
        <div class="trust-item">
          <CheckCircle2 size={17} color="#06b6d4" />
          <span>Garansi Refill 30 Hari</span>
        </div>
      </div>
    </div>

    <!-- Visual Interactive Hero Card -->
    <div class="hero-visual">
      <div class="glass-panel ig-mockup-card">
        <div class="mockup-header">
          <div class="mockup-avatar">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Avatar User"
            />
          </div>
          <div class="mockup-user-info">
            <div class="mockup-handle">
              <span>@kreator.indonesia</span>
              <div class="verified-badge" title="Terverifikasi">✓</div>
            </div>
            <p class="mockup-bio">Content Creator & Lifestyle Influencer 🇮🇩</p>
          </div>
        </div>

        <!-- Live Growth Metrics Box -->
        <div class="mockup-stats-grid">
          <div class="stat-box">
            <span class="stat-num">142</span>
            <span class="stat-label">Posts</span>
          </div>
          <div class="stat-box stat-highlight">
            <div class="growth-indicator">
              <TrendingUp size={13} />
              <span>+2.500</span>
            </div>
            <span class="stat-num text-gradient">24.8K</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">389</span>
            <span class="stat-label">Following</span>
          </div>
        </div>

        <!-- Live Delivery Alert Banner -->
        <div class="live-delivery-alert">
          <div class="live-dot"></div>
          <div class="live-text">
            <p><strong>Pesanan Sedang Masuk:</strong> +500 Followers dialokasikan ke akun target.</p>
          </div>
        </div>

        <!-- Trust Rating Stars -->
        <div class="mockup-footer">
          <div class="stars-group">
            {#each Array(5) as _}
              <Star size={14} fill="#f59e0b" color="#f59e0b" />
            {/each}
          </div>
          <span class="rating-text">4.9/5 dari 14.200+ Pesanan Sukses</span>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .hero-section {
    position: relative;
    padding: 4.5rem 0 3.5rem;
    overflow: hidden;
  }

  @media (min-width: 768px) {
    .hero-section {
      padding: 6.5rem 0 5rem;
    }
  }

  .glow-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    pointer-events: none;
    z-index: 0;
  }

  .orb-1 {
    top: 10%;
    left: 20%;
    width: 350px;
    height: 350px;
    background: rgba(236, 72, 153, 0.12);
  }

  .orb-2 {
    bottom: 10%;
    right: 15%;
    width: 400px;
    height: 400px;
    background: rgba(139, 92, 246, 0.12);
  }

  .hero-container {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr;
    gap: 3.5rem;
    align-items: center;
  }

  @media (min-width: 1024px) {
    .hero-container {
      grid-template-columns: 1.15fr 0.85fr;
      gap: 4rem;
    }
  }

  .hero-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(236, 72, 153, 0.1);
    border: 1px solid rgba(236, 72, 153, 0.3);
    padding: 0.45rem 1rem;
    border-radius: var(--radius-full);
    font-size: 0.82rem;
    font-weight: 600;
    color: #f472b6;
    margin-bottom: 1.5rem;
    box-shadow: 0 0 15px rgba(236, 72, 153, 0.15);
  }

  .badge-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--ig-pink);
    animation: pulseGlow 1.5s infinite;
  }

  .hero-title {
    font-size: 2.5rem;
    line-height: 1.15;
    margin-bottom: 1.25rem;
    letter-spacing: -0.03em;
  }

  @media (min-width: 640px) {
    .hero-title {
      font-size: 3.25rem;
    }
  }

  @media (min-width: 1024px) {
    .hero-title {
      font-size: 3.75rem;
    }
  }

  .hero-desc {
    font-size: 1.05rem;
    color: var(--text-secondary);
    line-height: 1.65;
    margin-bottom: 2rem;
    max-width: 580px;
  }

  .hero-desc strong {
    color: var(--text-primary);
  }

  .hero-ctas {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2.5rem;
    width: 100%;
  }

  @media (min-width: 480px) {
    .hero-ctas {
      width: auto;
    }
  }

  .trust-list {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
  }

  .trust-item {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  /* Mockup Visual */
  .hero-visual {
    display: flex;
    justify-content: center;
  }

  .ig-mockup-card {
    width: 100%;
    max-width: 440px;
    padding: 1.75rem;
    border-radius: var(--radius-xl);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: var(--shadow-lg), 0 0 30px rgba(236, 72, 153, 0.15);
    background: rgba(14, 18, 28, 0.85);
  }

  .mockup-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .mockup-avatar img {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--ig-pink);
    padding: 2px;
  }

  .mockup-handle {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-weight: 700;
    font-size: 1.05rem;
  }

  .verified-badge {
    background: #0095f6;
    color: #ffffff;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 800;
  }

  .mockup-bio {
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  .mockup-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 1rem 0.5rem;
    margin-bottom: 1.25rem;
    text-align: center;
  }

  .stat-box {
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .stat-highlight {
    position: relative;
  }

  .growth-indicator {
    position: absolute;
    top: -18px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #34d399;
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
    display: flex;
    align-items: center;
    gap: 0.2rem;
    white-space: nowrap;
  }

  .stat-num {
    font-size: 1.25rem;
    font-weight: 800;
    font-family: var(--font-display);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .live-delivery-alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(236, 72, 153, 0.08);
    border: 1px solid rgba(236, 72, 153, 0.2);
    border-radius: var(--radius-md);
    padding: 0.75rem 0.9rem;
    margin-bottom: 1.25rem;
  }

  .live-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 10px #10b981;
    flex-shrink: 0;
  }

  .live-text p {
    font-size: 0.78rem;
    color: var(--text-secondary);
    line-height: 1.35;
  }

  .live-text strong {
    color: #ffffff;
  }

  .mockup-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-subtle);
  }

  .stars-group {
    display: flex;
    gap: 0.2rem;
  }

  .rating-text {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
  }
</style>
