<script lang="ts">
  import { ChevronDown, HelpCircle, Sparkles } from 'lucide-svelte';

  const faqs = [
    {
      q: 'Apakah layanan ini aman untuk akun Instagram saya?',
      a: 'Sangat aman 100%. Kami tidak pernah meminta password, PIN, atau login ke akun Anda. Kami hanya membutuhkan username publik sebagai target pengiriman followers. Metode pengiriman bertahap kami selaras dengan kebijakan platform Instagram.',
    },
    {
      q: 'Berapa lama followers akan mulai masuk ke akun saya?',
      a: 'Sistem kami mulai memproses pesanan otomatis dalam 5-15 menit setelah pembayaran dikonfirmasi. Kecepatan penyelesaian bergantung pada jumlah paket yang Anda pilih (biasanya 1-24 jam).',
    },
    {
      q: 'Apakah akun Instagram saya harus bersifat publik (tidak di-private)?',
      a: 'Ya, benar. Akun Instagram target wajib berstatus publik (tidak di-private/dikunci) selama proses pengiriman berlangsung agar followers dapat masuk dengan lancar. Setelah order selesai, Anda bebas mengaturnya kembali.',
    },
    {
      q: 'Bagaimana jika jumlah followers mengalami penurunan (drop)?',
      a: 'Kami memberikan Garansi Refill (isi ulang) selama 30 hari penuh. Jika terjadi penurunan followers alami, Anda dapat mengajukan refill melalui live support atau dashboard pesanan Anda.',
    },
    {
      q: 'Bagaimana cara memantau status pesanan saya?',
      a: 'Anda dapat menggunakan fitur "Cek Pesanan" di navbar dan memasukkan ID Pesanan (contoh: PF-202609-XXXX). Status pesanan diperbarui secara real-time mulai dari pembayaran hingga selesai.',
    },
    {
      q: 'Metode pembayaran apa saja yang didukung?',
      a: 'Kami menerima QRIS otomatis (mendukung seluruh aplikasi BCA Mobile, Livin Mandiri, BRImo, GoPay, OVO, DANA, ShopeePay, LinkAja) serta Virtual Account dan transfer bank 24 jam.',
    },
  ];

  let openIndex: number | null = 0;

  function toggleFaq(index: number) {
    openIndex = openIndex === index ? null : index;
  }
</script>

<section id="faq" class="faq-section">
  <div class="container">
    <div class="section-header">
      <div class="badge badge-glow">
        <Sparkles size={12} />
        <span>Tanya Jawab</span>
      </div>
      <h2 class="section-title">Pertanyaan yang Sering Diajukan</h2>
      <p class="section-desc">Jawaban lengkap seputar keamanan, waktu proses, dan garansi layanan kami.</p>
    </div>

    <div class="faq-accordion-wrapper">
      {#each faqs as item, idx}
        <div class="glass-card faq-item {openIndex === idx ? 'faq-active' : ''}">
          <button class="faq-question" on:click={() => toggleFaq(idx)}>
            <span class="q-text">{item.q}</span>
            <div class="chevron-box {openIndex === idx ? 'chevron-rotated' : ''}">
              <ChevronDown size={18} />
            </div>
          </button>
          {#if openIndex === idx}
            <div class="faq-answer animate-fade-in">
              <p>{item.a}</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .faq-section {
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

  .faq-accordion-wrapper {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .faq-item {
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all 0.25s ease;
  }

  .faq-active {
    border-color: rgba(236, 72, 153, 0.35);
    background: rgba(18, 22, 34, 0.9);
  }

  .faq-question {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.35rem 1.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    gap: 1rem;
  }

  .q-text {
    font-size: 1.02rem;
    font-weight: 600;
    color: #ffffff;
    font-family: var(--font-display);
  }

  .chevron-box {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: transform 0.25s ease;
    flex-shrink: 0;
  }

  .chevron-rotated {
    transform: rotate(180deg);
    color: var(--ig-pink);
    background: rgba(236, 72, 153, 0.12);
  }

  .faq-answer {
    padding: 0 1.5rem 1.35rem;
    color: var(--text-secondary);
    font-size: 0.92rem;
    line-height: 1.65;
  }
</style>
