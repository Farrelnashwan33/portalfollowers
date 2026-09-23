<script lang="ts">
  import { Instagram, ShieldCheck, Zap, Lock, Heart } from 'lucide-svelte';
</script>

<footer class="footer-wrapper">
  <div class="container footer-content">
    <div class="footer-grid">
      <!-- Col 1: Brand & Security -->
      <div class="footer-col brand-col">
        <a href="/" class="brand-logo">
          <div class="logo-icon">
            <Instagram size={20} color="#ffffff" />
          </div>
          <span class="logo-text">Portal<span class="text-gradient">Followers</span></span>
        </a>
        <p class="brand-desc">
          Platform terpercaya untuk akselerasi pertumbuhan Instagram nomor #1 di Indonesia. Bergaransi, cepat, dan tanpa password akun.
        </p>
        <div class="security-pill">
          <ShieldCheck size={16} color="#10b981" />
          <span>100% Privasi & Tanpa Password</span>
        </div>
      </div>

      <!-- Col 2: Navigasi Cepat -->
      <div class="footer-col">
        <h4 class="col-title">Layanan</h4>
        <ul class="footer-links">
          <li><a href="/packages">Paket Followers Aktif</a></li>
          <li><a href="/packages">Paket Influencer</a></li>
          <li><a href="/packages">Paket Bisnis & Brand</a></li>
          <li><a href="/#how-it-works">Cara Pemesanan</a></li>
          <li><a href="/dashboard">Dashboard Pengguna</a></li>
        </ul>
      </div>

      <!-- Col 3: Bantuan & Keamanan -->
      <div class="footer-col">
        <h4 class="col-title">Bantuan & Legal</h4>
        <ul class="footer-links">
          <li><a href="/#faq">Pusat Bantuan & FAQ</a></li>
          <li><a href="/#features">Garansi Layanan</a></li>
          <li><a href="/order/check">Cek Status Pesanan</a></li>
          <li><a href="#privacy">Kebijakan Privasi</a></li>
          <li><a href="#terms">Syarat & Ketentuan</a></li>
        </ul>
      </div>

      <!-- Col 4: Metode Pembayaran -->
      <div class="footer-col">
        <h4 class="col-title">Metode Pembayaran</h4>
        <p class="payment-desc">Mendukung pembayaran otomatis 24 jam dengan konfirmasi instan:</p>
        <div class="payment-badges">
          <span class="pay-chip">QRIS</span>
          <span class="pay-chip">BCA</span>
          <span class="pay-chip">Mandiri</span>
          <span class="pay-chip">BRI</span>
          <span class="pay-chip">GoPay</span>
          <span class="pay-chip">OVO</span>
          <span class="pay-chip">DANA</span>
          <span class="pay-chip">ShopeePay</span>
        </div>
      </div>
    </div>

    <hr class="footer-divider" />

    <div class="footer-bottom">
      <p class="copyright">
        © 2026 <strong>Portal Followers</strong>. Hak cipta dilindungi undang-undang.
      </p>
      <p class="disclaimer">
        Portal Followers adalah layanan independen dan tidak berafiliasi langsung dengan Instagram atau Meta Platforms, Inc.
      </p>
    </div>
  </div>
</footer>

<style>
  .footer-wrapper {
    background: #040508;
    border-top: 1px solid var(--border-subtle);
    padding: 4.5rem 0 2.5rem;
    position: relative;
    margin-top: 5rem;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2.5rem;
    margin-bottom: 3.5rem;
  }

  @media (min-width: 640px) {
    .footer-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .footer-grid {
      grid-template-columns: 1.5fr 1fr 1fr 1.3fr;
      gap: 3rem;
    }
  }

  .brand-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.2rem;
    font-weight: 800;
    margin-bottom: 1rem;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--gradient-ig);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .brand-desc {
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.6;
    margin-bottom: 1.25rem;
  }

  .security-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);
    padding: 0.4rem 0.85rem;
    border-radius: var(--radius-full);
    font-size: 0.8rem;
    color: #34d399;
    font-weight: 600;
  }

  .col-title {
    font-size: 1rem;
    color: #ffffff;
    margin-bottom: 1.25rem;
    font-family: var(--font-display);
    letter-spacing: -0.01em;
  }

  .footer-links {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .footer-links a {
    color: var(--text-secondary);
    font-size: 0.88rem;
    transition: color 0.2s ease, transform 0.2s ease;
    display: inline-block;
  }

  .footer-links a:hover {
    color: #ffffff;
    transform: translateX(3px);
  }

  .payment-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }

  .payment-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .pay-chip {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border-subtle);
    padding: 0.3rem 0.65rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .footer-divider {
    border: none;
    border-top: 1px solid var(--border-subtle);
    margin-bottom: 2rem;
  }

  .footer-bottom {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    text-align: center;
  }

  @media (min-width: 768px) {
    .footer-bottom {
      flex-direction: row;
      text-align: left;
    }
  }

  .copyright {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .disclaimer {
    font-size: 0.78rem;
    color: var(--text-muted);
    max-width: 500px;
  }
</style>
