<script lang="ts">
  import { toast } from '$stores/toastStore';
  import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-svelte';
</script>

<div class="toast-container" aria-live="polite">
  {#each $toast as item (item.id)}
    <div class="toast-item toast-{item.type}">
      <div class="toast-icon">
        {#if item.type === 'success'}
          <CheckCircle size={18} color="#10b981" />
        {:else if item.type === 'error'}
          <AlertCircle size={18} color="#f43f5e" />
        {:else if item.type === 'warning'}
          <AlertTriangle size={18} color="#f59e0b" />
        {:else}
          <Info size={18} color="#06b6d4" />
        {/if}
      </div>
      <div class="toast-body">
        <p class="toast-text">{item.message}</p>
      </div>
      <button
        class="toast-close"
        on:click={() => toast.dismiss(item.id)}
        aria-label="Tutup notifikasi"
      >
        <X size={15} />
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 1.25rem;
    right: 1.25rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 380px;
    width: calc(100% - 2.5rem);
    pointer-events: none;
  }

  .toast-item {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: rgba(18, 22, 34, 0.95);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .toast-success {
    border-color: rgba(16, 185, 129, 0.3);
  }

  .toast-error {
    border-color: rgba(244, 63, 94, 0.3);
  }

  .toast-warning {
    border-color: rgba(245, 158, 11, 0.3);
  }

  .toast-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toast-body {
    flex: 1;
  }

  .toast-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    line-height: 1.4;
    margin: 0;
  }

  .toast-close {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    padding: 0.25rem;
    border-radius: 4px;
    transition: color 0.2s;
  }

  .toast-close:hover {
    color: var(--text-primary);
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
</style>
