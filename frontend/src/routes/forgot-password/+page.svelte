<script lang="ts">
  import { forgotPasswordApi } from '$services/api';
  import { toast } from '$stores/toastStore';
  import { Instagram, Mail, ArrowRight, ArrowLeft } from 'lucide-svelte';

  let email = '';
  let loading = false;
  let sent = false;

  async function handleResetRequest() {
    if (!email) {
      toast.error('Silakan isi email Anda.');
      return;
    }

    loading = true;
    try {
      const res = await forgotPasswordApi(email.trim().toLowerCase());
      if (res.success) {
        sent = true;
        toast.success(res.message || 'Tautan pemulihan kata sandi telah dikirim ke email Anda.');
      } else {
        toast.error(res.error || 'Gagal mengirim tautan reset password.');
      }
    } catch (e) {
      toast.error('Gagal mengirim tautan reset password.');
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Lupa Password - Portal Followers</title>
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
        <h1 class="auth-title">Pemulihan Password</h1>
        <p class="auth-sub">Masukkan email yang terdaftar untuk menerima tautan pemulihan akun</p>
      </div>

      {#if sent}
        <div class="sent-box">
          <p class="sent-text">
            Kami telah memproses instruksi pemulihan untuk <strong>{email}</strong>. Silakan periksa kotak masuk email Anda.
          </p>
          <a href="/login" class="btn btn-secondary w-full">Kembali ke Halaman Masuk</a>
        </div>
      {:else}
        <form on:submit|preventDefault={handleResetRequest} class="auth-form">
          <div class="form-group">
            <label for="reset-email" class="input-label">Alamat Email</label>
            <div class="input-with-icon">
              <Mail size={18} class="field-icon" />
              <input
                id="reset-email"
                type="email"
                class="input-field has-left-icon"
                placeholder="nama@email.com"
                bind:value={email}
                required
              />
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg w-full submit-btn" disabled={loading}>
            {#if loading}
              <span>Mengirim Tautan...</span>
            {:else}
              <span>Kirim Tautan Pemulihan</span>
              <ArrowRight size={18} />
            {/if}
          </button>
        </form>
      {/if}

      <div class="auth-footer">
        <a href="/login" class="back-link">
          <ArrowLeft size={16} />
          <span>Kembali ke Halaman Masuk</span>
        </a>
      </div>
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
    border: 1px solid rgba(255, 255, 255, 0.1);
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

  .sent-box {
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);
    border-radius: var(--radius-md);
    padding: 1.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .sent-text {
    font-size: 0.9rem;
    color: #34d399;
    line-height: 1.5;
  }

  .auth-footer {
    text-align: center;
    margin-top: 1.75rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-subtle);
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.88rem;
    color: var(--text-secondary);
    transition: color 0.2s;
  }

  .back-link:hover {
    color: #ffffff;
  }

  .w-full {
    width: 100%;
  }
</style>
