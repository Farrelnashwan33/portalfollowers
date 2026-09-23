<script lang="ts">
  import { resetPasswordApi } from '$services/api';
  import { toast } from '$stores/toastStore';
  import { page } from '$app/stores';
  import { Instagram, Lock, ArrowRight } from 'lucide-svelte';

  let newPassword = '';
  let confirmPassword = '';
  let loading = false;

  async function handleUpdatePassword() {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok.');
      return;
    }

    loading = true;
    try {
      const token = $page.url.searchParams.get('token') || undefined;
      const res = await resetPasswordApi(newPassword, token);

      if (res.success) {
        toast.success(res.message || 'Password berhasil diperbarui! Silakan masuk kembali.');
        window.location.href = '/login';
      } else {
        toast.error(res.error || 'Gagal memperbarui password.');
      }
    } catch (e) {
      toast.error('Gagal memperbarui password.');
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Reset Password - Portal Followers</title>
</svelte:head>

<div class="auth-page">
  <div class="container">
    <div class="auth-card glass-panel animate-fade-in">
      <div class="auth-header">
        <a href="/" class="auth-logo">
          <div class="logo-icon">
            <Instagram size={24} color="#ffffff" />
          </div>
          <span>Portal<span class="text-gradient">Followers</span></span>
        </a>
        <h1 class="auth-title">Atur Ulang Password</h1>
        <p class="auth-sub">Masukkan kata sandi baru untuk akun Anda</p>
      </div>

      <form on:submit|preventDefault={handleUpdatePassword} class="auth-form">
        <div class="form-group">
          <label for="new-pass" class="input-label">Password Baru</label>
          <div class="input-with-icon">
            <Lock size={18} class="field-icon" />
            <input
              id="new-pass"
              type="password"
              class="input-field has-left-icon"
              placeholder="Minimal 6 karakter"
              bind:value={newPassword}
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="conf-pass" class="input-label">Konfirmasi Password Baru</label>
          <div class="input-with-icon">
            <Lock size={18} class="field-icon" />
            <input
              id="conf-pass"
              type="password"
              class="input-field has-left-icon"
              placeholder="Ulangi password"
              bind:value={confirmPassword}
              required
            />
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-full submit-btn" disabled={loading}>
          {#if loading}
            <span>Menyimpan Password...</span>
          {:else}
            <span>Perbarui Password</span>
            <ArrowRight size={18} />
          {/if}
        </button>
      </form>
    </div>
  </div>
</div>

<style>
  .auth-page {
    min-height: calc(100vh - 160px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem 0 5rem;
  }

  .auth-card {
    max-width: 460px;
    margin: 0 auto;
    padding: 2.75rem 2.25rem;
    border-radius: var(--radius-xl);
  }

  .auth-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .auth-logo {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.35rem;
    font-weight: 800;
    margin-bottom: 1.25rem;
  }

  .logo-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--gradient-ig);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .auth-title {
    font-size: 1.65rem;
    color: #ffffff;
    margin-bottom: 0.35rem;
  }

  .auth-sub {
    font-size: 0.88rem;
    color: var(--text-secondary);
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .input-with-icon {
    position: relative;
    display: flex;
    align-items: center;
  }

  :global(.field-icon) {
    position: absolute;
    left: 1rem;
    color: var(--text-muted);
    pointer-events: none;
  }

  .has-left-icon {
    padding-left: 2.75rem;
  }

  .w-full {
    width: 100%;
  }
</style>
