<script lang="ts">
  import type { PaymentStatus, ServiceStatus } from '$types';
  import { Check, Clock, Zap, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-svelte';

  export let paymentStatus: PaymentStatus | string = 'pending';
  export let serviceStatus: ServiceStatus | string = 'pending';
  export let history: any[] = [];

  // Determine active step index (0: Dibuat, 1: Pembayaran, 2: Diproses, 3: Selesai)
  $: pStatus = (paymentStatus || '').toLowerCase();
  $: sStatus = (serviceStatus || '').toLowerCase();
  $: isFailed = pStatus === 'failed' || pStatus === 'expired' || sStatus === 'failed' || sStatus === 'cancelled';

  $: stepIndex = (() => {
    if (sStatus === 'completed') return 3;
    if (sStatus === 'processing' || sStatus === 'in_progress') return 2;
    if (pStatus === 'paid' || pStatus === 'admin_approved') return 1;
    return 0;
  })();

  const steps = [
    { title: 'Pesanan Dibuat', subtitle: 'Order terdaftar di database', icon: Clock },
    { title: 'Pembayaran Dikonfirmasi', subtitle: 'Dana berhasil diverifikasi', icon: Zap },
    { title: 'Sedang Diproses', subtitle: 'Followers dialokasikan ke akun', icon: Clock },
    { title: 'Pesanan Selesai', subtitle: 'Pengiriman followers tuntas 100%', icon: CheckCircle2 },
  ];
</script>

<div class="timeline-wrapper">
  {#if isFailed}
    <div class="failed-alert">
      <AlertCircle size={20} color="#f43f5e" />
      <div>
        <h4 class="failed-title">Pesanan Dibatalkan / Gagal</h4>
        <p class="failed-desc">Pembayaran kadaluarsa atau terjadi kegagalan sistem. Hubungi bantuan jika ada kendala.</p>
      </div>
    </div>
  {/if}

  <div class="steps-track">
    {#each steps as s, idx}
      {@const isPast = !isFailed && idx < stepIndex}
      {@const isCurrent = !isFailed && idx === stepIndex}
      {@const isUpcoming = !isFailed && idx > stepIndex}

      <div class="timeline-step {isPast ? 'step-past' : ''} {isCurrent ? 'step-current' : ''} {isUpcoming ? 'step-upcoming' : ''} {isFailed ? 'step-failed' : ''}">
        <div class="step-indicator">
          <div class="step-icon-circle">
            {#if isPast}
              <Check size={16} color="#ffffff" />
            {:else if isCurrent}
              <div class="pulse-dot"></div>
              <svelte:component this={s.icon} size={16} color="#ffffff" />
            {:else if isFailed && idx === stepIndex}
              <AlertTriangle size={16} color="#ffffff" />
            {:else}
              <span class="step-num">{idx + 1}</span>
            {/if}
          </div>
          {#if idx < steps.length - 1}
            <div class="step-connector {isPast ? 'connector-filled' : ''}"></div>
          {/if}
        </div>

        <div class="step-label-box">
          <h4 class="step-title">{s.title}</h4>
          <p class="step-sub">{s.subtitle}</p>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .timeline-wrapper {
    width: 100%;
    padding: 1.5rem 0;
  }

  .failed-alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(244, 63, 94, 0.1);
    border: 1px solid rgba(244, 63, 94, 0.3);
    border-radius: var(--radius-md);
    padding: 1rem 1.25rem;
    margin-bottom: 2rem;
  }

  .failed-title {
    font-size: 0.95rem;
    color: #f43f5e;
    font-weight: 700;
  }

  .failed-desc {
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  .steps-track {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 640px) {
    .steps-track {
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
    }
  }

  .timeline-step {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    position: relative;
  }

  @media (min-width: 640px) {
    .timeline-step {
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.75rem;
    }
  }

  .step-indicator {
    display: flex;
    align-items: center;
    position: relative;
  }

  @media (min-width: 640px) {
    .step-indicator {
      width: 100%;
      justify-content: center;
    }
  }

  .step-icon-circle {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2;
    transition: all 0.3s ease;
  }

  .step-num {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .step-connector {
    display: none;
  }

  @media (min-width: 640px) {
    .step-connector {
      display: block;
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100%;
      height: 2px;
      background: var(--border-subtle);
      z-index: 1;
      transform: translateY(-50%);
    }

    .connector-filled {
      background: var(--accent-emerald);
    }
  }

  /* States */
  .step-past .step-icon-circle {
    background: var(--accent-emerald);
    border-color: var(--accent-emerald);
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
  }

  .step-past .step-title {
    color: var(--accent-emerald);
  }

  .step-current .step-icon-circle {
    background: var(--gradient-ig);
    border-color: #f472b6;
    box-shadow: 0 0 20px rgba(236, 72, 153, 0.5);
  }

  .step-current .step-title {
    color: #ffffff;
  }

  .pulse-dot {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid var(--ig-pink);
    animation: pulseGlow 1.5s infinite;
  }

  .step-upcoming .step-title {
    color: var(--text-muted);
  }

  .step-label-box {
    display: flex;
    flex-direction: column;
  }

  .step-title {
    font-size: 0.95rem;
    font-weight: 700;
    margin-bottom: 0.2rem;
    font-family: var(--font-display);
  }

  .step-sub {
    font-size: 0.78rem;
    color: var(--text-muted);
    line-height: 1.35;
  }
</style>
