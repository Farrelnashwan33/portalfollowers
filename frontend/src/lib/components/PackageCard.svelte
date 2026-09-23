<script lang="ts">
  import type { Package } from '$types';
  import { formatCurrency, formatNumber } from '$utils/formatters';
  import { Check, Clock, Zap, Shield, Sparkles } from 'lucide-svelte';

  export let pkg: Package;
  export let onSelect: (pkg: Package) => void;

  $: isFeatured = pkg.badge === 'Paling Populer' || pkg.badge === 'Best Value' || pkg.followers === 1000;
</script>

<div class="package-card glass-card {isFeatured ? 'featured-card' : ''}">
  {#if pkg.badge}
    <div class="package-badge-wrapper">
      <span class="badge badge-glow {pkg.badge === 'Paling Populer' ? 'badge-primary' : ''}">
        <Sparkles size={11} />
        {pkg.badge}
      </span>
    </div>
  {/if}

  <div class="card-header">
    <h3 class="package-name">{pkg.name}</h3>
    <div class="followers-count">
      <span class="count-number">{formatNumber(pkg.followers)}</span>
      <span class="count-unit">Followers</span>
    </div>
    <p class="package-desc">{pkg.description || 'Pertumbuhan followers Instagram berkualitas tinggi dan aman.'}</p>
  </div>

  <div class="pricing-box">
    <div class="price-val">{formatCurrency(pkg.price)}</div>
    <div class="delivery-time">
      <Clock size={13} color="#94a3b8" />
      <span>Estimasi: {pkg.estimated_time || '1-24 Jam'}</span>
    </div>
  </div>

  <ul class="feature-checklist">
    <li>
      <div class="check-circle"><Check size={12} color="#10b981" /></div>
      <span>Kualitas High Quality Profile</span>
    </li>
    <li>
      <div class="check-circle"><Check size={12} color="#10b981" /></div>
      <span>Garansi Refill 30 Hari</span>
    </li>
    <li>
      <div class="check-circle"><Check size={12} color="#10b981" /></div>
      <span>100% Aman Tanpa Password Akun</span>
    </li>
    <li>
      <div class="check-circle"><Check size={12} color="#10b981" /></div>
      <span>Pengiriman Bertahap & Natural</span>
    </li>
    <li>
      <div class="check-circle"><Check size={12} color="#10b981" /></div>
      <span>Dukungan Customer Care 24/7</span>
    </li>
  </ul>

  <button
    class="btn {isFeatured ? 'btn-primary' : 'btn-secondary'} order-button"
    on:click={() => onSelect(pkg)}
  >
    <Zap size={16} />
    <span>Pesan Sekarang</span>
  </button>
</div>

<style>
  .package-card {
    position: relative;
    padding: 2.25rem 1.75rem 2rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    border-radius: var(--radius-xl);
  }

  .featured-card {
    border-color: rgba(236, 72, 153, 0.45);
    background: linear-gradient(180deg, rgba(236, 72, 153, 0.08) 0%, rgba(18, 22, 34, 0.9) 100%);
    box-shadow: 0 15px 35px -10px rgba(236, 72, 153, 0.25);
    transform: scale(1.02);
  }

  .featured-card:hover {
    transform: scale(1.04) translateY(-3px);
  }

  .package-badge-wrapper {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
  }

  .badge-primary {
    background: var(--gradient-ig);
    color: #ffffff;
    border: none;
    box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
  }

  .card-header {
    margin-bottom: 1.5rem;
  }

  .package-name {
    font-size: 1.15rem;
    color: var(--text-secondary);
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .followers-count {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    margin-bottom: 0.75rem;
  }

  .count-number {
    font-size: 2.25rem;
    font-weight: 800;
    font-family: var(--font-display);
    color: #ffffff;
    letter-spacing: -0.02em;
  }

  .count-unit {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--ig-pink);
  }

  .package-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.5;
    min-height: 38px;
  }

  .pricing-box {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 1.1rem;
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .price-val {
    font-size: 1.6rem;
    font-weight: 800;
    font-family: var(--font-display);
    color: #ffffff;
  }

  .delivery-time {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .feature-checklist {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 2rem;
    flex: 1;
  }

  .feature-checklist li {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .check-circle {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .order-button {
    width: 100%;
  }
</style>
