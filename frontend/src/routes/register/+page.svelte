<script lang="ts">
  import { registerApi } from '$services/api';
  import { auth } from '$stores/authStore';
  import { toast } from '$stores/toastStore';
  import { Instagram, Lock, Mail, User, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-svelte';

  let fullName = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let showPassword = false;
  let loading = false;

  async function handleRegister() {
    if (!fullName || !email || !password) {
      toast.error('Silakan lengkapi seluruh formulir pendaftaran.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok.');
      return;
    }

    loading = true;
    try {
      const res = await registerApi(fullName.trim(), email.trim().toLowerCase(), password, 'user');

      if (!res.success || !res.data) {
        toast.error(res.error || 'Gagal mendaftar. Silakan coba lagi.');
        return;
      }

      const { token, user, profile } = res.data;
      auth.setSession(token, user, profile);

      toast.success('Pendaftaran berhasil! Selamat datang di Portal Followers.');
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error('Terjadi kendala saat mendaftar.');
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Daftar Akun Baru - Portal Followers</title>
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
        <h1 class="auth-title">Buat Akun Pengguna</h1>
        <p class="auth-sub">Daftar untuk memantau semua pesanan dan nikmati diskon member eksklusif</p>
      </div>

      <form on:submit|preventDefault={handleRegister} class="auth-form">
        <div class="form-group">
          <label for="reg-name" class="input-label">Nama Lengkap</label>
          <div class="input-with-icon">
            <User size={18} class="field-icon" />
            <input
              id="reg-name"
              type="text"
              class="input-field has-left-icon"
              placeholder="Farrel Nashwan"
              bind:value={fullName}
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="reg-email" class="input-label">Alamat Email</label>
          <div class="input-with-icon">
            <Mail size={18} class="field-icon" />
            <input
              id="reg-email"
              type="email"
              class="input-field has-left-icon"
              placeholder="nama@email.com"
              bind:value={email}
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="reg-password" class="input-label">Password</label>
          <div class="input-with-icon">
            <Lock size={18} class="field-icon" />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              class="input-field has-left-icon has-right-icon"
              placeholder="Minimal 6 karakter"
              bind:value={password}
              required
            />
            <button
              type="button"
              class="eye-btn"
              on:click={() => (showPassword = !showPassword)}
              aria-label="Toggle password"
            >
              {#if showPassword}
                <EyeOff size={18} />
              {:else}
                <Eye size={18} />
              {/if}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="reg-confirm" class="input-label">Konfirmasi Password</label>
          <div class="input-with-icon">
            <Lock size={18} class="field-icon" />
            <input
              id="reg-confirm"
              type={showPassword ? 'text' : 'password'}
              class="input-field has-left-icon"
              placeholder="Ulangi password"
              bind:value={confirmPassword}
              required
            />
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-full submit-btn" disabled={loading}>
          {#if loading}
            <span class="spinner"></span>
            <span>Mendaftarkan Akun...</span>
          {:else}
            <span>Daftar Sekarang</span>
            <ArrowRight size={18} />
          {/if}
        </button>
      </form>

      <div class="auth-footer">
        <p>Sudah punya akun? <a href="/login" class="text-gradient font-bold">Masuk di sini</a></p>
      </div>

      <div class="auth-security-notice">
        <ShieldCheck size={16} color="#10b981" />
        <span>Kami TIDAK PERNAH meminta password akun Instagram Anda</span>
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
    max-width: 480px;
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
    gap: 1.2rem;
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

  .has-right-icon {
    padding-right: 2.75rem;
  }

  .eye-btn {
    position: absolute;
    right: 0.85rem;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .eye-btn:hover {
    color: #ffffff;
  }

  .submit-btn {
    margin-top: 0.5rem;
  }

  .auth-footer {
    text-align: center;
    margin-top: 1.75rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-subtle);
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .font-bold {
    font-weight: 700;
  }

  .auth-security-notice {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 1.25rem;
    text-align: center;
  }

  .w-full {
    width: 100%;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
