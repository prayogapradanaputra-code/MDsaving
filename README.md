# MDsaving — Next.js + PostgreSQL Production Stack

Refactor ini memindahkan MDsaving ke struktur **Next.js App Router + PostgreSQL** yang lebih cocok untuk production dan deploy awal.

## Stack
- Next.js App Router
- React + TypeScript
- PostgreSQL via `pg`
- Session auth sederhana (email + password)
- API Routes di `/app/api/*`
- CSS design system sederhana tanpa dependency styling tambahan
- Railway-ready Docker deployment

## Fitur auth yang sudah ditambahkan
- Sign up
- Login
- Logout
- Session cookie berbasis database
- Isolasi data per user untuk jobs, assets, presets, dan stats

## Jalankan lokal
1. Install dependency
```bash
npm install
```
2. Buat database PostgreSQL baru.
3. Jalankan schema:
```bash
psql "$DATABASE_URL" -f sql/schema.sql
```
4. Copy `.env.example` ke `.env.local` lalu isi `DATABASE_URL`.
5. Jalankan:
```bash
npm run dev
```
6. Buka `http://localhost:3000`
7. Buat akun baru dari UI lalu masuk ke dashboard.

## Deploy ke Railway
Lihat panduan lengkap di:

- `DEPLOY-RAILWAY.md`

File deploy yang sudah disiapkan:
- `Dockerfile`
- `railway.json`
- `.dockerignore`
- `.env.example`

## Endpoint utama
- `GET /api/health`
- `POST /api/detect`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/jobs`
- `POST /api/jobs`
- `POST /api/jobs/process-all`
- `DELETE /api/jobs/clear`
- `GET /api/assets`
- `GET /api/presets`
- `POST /api/presets`
- `GET /api/stats`
- `POST /api/seed-demo`

## Catatan penting
- Ini adalah **production stack starter**, bukan final production infra.
- Untuk launch serius, next step yang direkomendasikan:
  - email verification + reset password
  - auth provider atau RBAC yang lebih matang
  - Redis/BullMQ untuk queue nyata
  - object storage (S3/R2)
  - billing dan audit logging

## Positioning produk
Build ini diarahkan untuk workflow aset milik pengguna, aset berlisensi, atau sumber yang memang mengizinkan penyimpanan.
