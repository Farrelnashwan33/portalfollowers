<script lang="ts">
  import { loginApi } from '$services/api';
  import { auth } from '$stores/authStore';
  import { toast } from '$stores/toastStore';
  import { Instagram, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-svelte';

  let email = '';
  let password = '';
  let showPassword = false;
  let loading = false;

  async function handleLogin() {
    if (!email || !password) {
      toast.error('Silakan isi email dan password.');
      return;
    }

    loading = true;
    try {
      const res = await loginApi(email.trim().toLowerCase(), password);

      if (!res.success || !res.data) {
        toast.error(res.error || 'Email atau password salah.');
        return;
      }

      const { token, user, profile } = res.data;
      auth.setSession(token, user, profile);

      toast.success('Berhasil masuk!');
      
      // Check admin status
      const userRole = (profile?.role || user?.role || '').toUpperCase();
      if (userRole === 'ADMIN' || email.includes('admin')) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      toast.error('Terjadi kendala autentikasi. Silakan periksa koneksi.');
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Masuk Akun - Portal Followers</title>
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
        <h1 class="auth-title">Selamat Datang Kembali</h1>
        <p class="auth-sub">Masuk untuk melihat riwayat pesanan dan mengelola akun Anda</p>
      </div>

      <form on:submit|preventDefault={handleLogin} class="auth-form">
        <div class="form-group">
          <label for="login-email" class="input-label">Alamat Email</label>
          <div class="input-with-icon">
            <Mail size={18} class="field-icon" />
            <input
              id="login-email"
              type="email"
              class="input-field has-left-icon"
              placeholder="nama@email.com"
              bind:value={email}
              required
            />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label for="login-password" class="input-label">Password Akun</label>
            <a href="/forgot-password" class="forgot-link">Lupa password?</a>
          </div>
          <div class="input-with-icon">
            <Lock size={18} class="field-icon" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              class="input-field has-left-icon has-right-icon"
              placeholder="••••••••"
              bind:value={password}
              required
            />
            <button
              type="button"
              class="eye-btn"
              on:click={() => (showPassword = !showPassword)}
              aria-label="Toggle password visibility"
            >
              {#if showPassword}
                <EyeOff size={18} />
              {:else}
                <Eye size={18} />
              {/if}
            </button>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-full submit-btn" disabled={loading}>
          {#if loading}
            <span class="spinner"></span>
            <span>Memverifikasi...</span>
          {:else}
            <span>Masuk ke Dashboard</span>
            <ArrowRight size={18} />
          {/if}
        </button>
      </form>

      <div class="auth-footer">
        <p>Belum memiliki akun? <a href="/register" class="text-gradient font-bold">Daftar sekarang</a></p>
      </div>

      <div class="auth-security-notice">
        <ShieldCheck size={16} color="#10b981" />
        <span>Keamanan data terlindungi dengan enkripsi SSL 256-bit</span>
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

  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .forgot-link {
    font-size: 0.78rem;
    color: var(--ig-pink);
  }

  .forgot-link:hover {
    text-decoration: underline;
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
