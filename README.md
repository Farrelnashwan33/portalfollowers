# 🚀 Portal Followers - Platform Layanan Pertumbuhan Instagram Modern

Website SaaS modern dan aman untuk platform layanan pertumbuhan Instagram dengan sistem order followers otomatis, visual live tracking, dan dashboard pengguna & admin yang terintegrasi dengan database MySQL lokal (MAMP).

---

## 🔒 PENTING: KEAMANAN & PRIVASI AKUN

* **TIDAK PERNAH** meminta atau menyimpan password Instagram pengguna.
* **TIDAK PERNAH** meminta OTP, cookie, PIN, atau login otomatis.
* Sistem hanya menerima **username Instagram publik** sebagai target pengiriman layanan.
* Harga pesanan diverifikasi dan dihitung secara ketat di server-side database (tidak dapat dimanipulasi dari frontend).

---

## 🛠️ TECH STACK

* **Frontend**: Svelte / SvelteKit (TypeScript)
* **Backend / API**: Next.js App Router (TypeScript)
* **Database**: MySQL lokal (MAMP)
* **Authentication**: Backend JWT + Bcrypt Password Hash (Database MySQL)
* **Styling**: Modern Luxury Dark Theme CSS System (Glassmorphism, Outfit & Plus Jakarta Sans typography, micro-animations)

---

## 📂 STRUKTUR PROYEK

```
Portal Followers/
├── database/
│   └── portal_followers.sql      # Schema & seed data MySQL untuk MAMP
│
├── frontend/                     # SvelteKit App
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/       # Navbar, Hero, PackageCard, OrderModal, OrderTimeline, FAQ, Toast, dsb.
│   │   │   ├── services/         # Backend API Client (Packages, Orders, Auth)
│   │   │   ├── stores/           # Auth store & Toast store
│   │   │   ├── types/            # TypeScript interface definitions
│   │   │   └── utils/            # Formatters (IDR currency, date, numbers)
│   │   └── routes/
│   │       ├── +page.svelte      # Landing Page lengkap
│   │       ├── packages/         # Katalog & filter paket followers
│   │       ├── order/[orderId]/  # Live order tracking & invoice
│   │       ├── login/            # Login Pengguna & Admin
│   │       ├── register/         # Pendaftaran Akun Pengguna
│   │       ├── dashboard/        # Dashboard pengguna (riwayat pesanan & profil)
│   │       └── admin/            # Admin suite (kelola order, ubah status, CRUD paket)
│   └── static/                   # Favicon, robots.txt, sitemap.xml
│
└── backend/                      # Next.js API Server
    ├── app/api/
    │   ├── auth/                 # Register, Login, Me, Forgot Password, Reset Password
    │   ├── packages/             # GET (katalog paket aktif untuk publik)
    │   ├── orders/               # POST (buat order dengan verifikasi harga DB), GET (filter user)
    │   ├── admin/orders/         # GET (semua pesanan admin), PATCH (update payment & service status)
    │   ├── admin/packages/       # GET, POST, PATCH, DELETE (CRUD paket followers)
    │   └── webhooks/payment/     # Webhook payment gateway (Midtrans-ready)
    └── lib/
        ├── db.ts                 # MySQL Connection Pool & Query Helpers
        ├── auth.ts               # Bcrypt & JWT Helper
        ├── validations.ts        # Zod input validation schemas
        └── order-code.ts         # Generator kode pesanan unik
```

---

## ⚡ PANDUAN MENJALANKAN SECARA LOKAL

### 1. Setup MySQL MAMP
1. Buka aplikasi **MAMP** di macOS dan klik **Start Servers**.
2. Pastikan MySQL berjalan pada port `8889` (default MAMP).
3. Import database `database/portal_followers.sql` melalui phpMyAdmin MAMP (`http://localhost:8888/phpMyAdmin/`) atau via terminal:
   ```bash
   /Applications/MAMP/Library/bin/mysql -u root -proot -P 8889 -h 127.0.0.1 < database/portal_followers.sql
   ```

### 2. Jalankan Backend (Next.js API)
```bash
cd backend
cp .env.example .env.local
npm install
npm run dev
```
Backend akan berjalan di `http://localhost:3001`.

### 3. Jalankan Frontend (SvelteKit)
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Frontend akan berjalan di `http://localhost:3000` (atau port yang ditentukan Vite).

---

## 🔑 AKUN DEFAULT SEED (MySQL)

* **Admin**: `admin@portalfollowers.com` / `admin123`
