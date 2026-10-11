# Deploy MDsaving ke Railway

Panduan ini menyiapkan **MDsaving Next.js + PostgreSQL** untuk deploy awal di Railway.

## Yang sudah siap di project ini
- Next.js App Router
- Auth email + password sederhana
- PostgreSQL schema di `sql/schema.sql`
- Endpoint health check di `/api/health`
- `Dockerfile` untuk build + run app
- `railway.json` untuk health check dan restart policy

## Alur deploy yang direkomendasikan
1. Upload project ini ke GitHub.
2. Buat project baru di Railway.
3. Tambahkan service **PostgreSQL**.
4. Tambahkan service **app** dari repo ini.
5. Set environment variables.
6. Jalankan schema database.
7. Deploy dan tes login.

## Environment variables yang wajib
Set di service app Railway:

- `DATABASE_URL` → pakai connection string dari PostgreSQL Railway
- `NEXT_PUBLIC_APP_NAME=MDsaving`
- `NODE_ENV=production`

Catatan:
- `PORT` biasanya disediakan otomatis oleh Railway.
- Container sudah disiapkan untuk listen ke `0.0.0.0`.

## Langkah deploy detail

### 1) Push source code
Pastikan isi folder ini masuk ke repo:
- `app/`
- `components/`
- `lib/`
- `sql/`
- `package.json`
- `Dockerfile`
- `railway.json`

### 2) Buat PostgreSQL di Railway
- Buat project baru.
- Tambahkan database PostgreSQL.
- Copy `DATABASE_URL` dari service database.

### 3) Tambahkan service app
- Deploy dari repo GitHub.
- Railway akan membaca `Dockerfile` dan `railway.json`.

### 4) Set variables di service app
Tambahkan:

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_NAME=MDsaving
NODE_ENV=production
```

### 5) Jalankan schema database
Sebelum login dipakai, jalankan schema `sql/schema.sql` ke database Railway.

Pilihan paling aman:
- buka shell/console yang terhubung ke app atau database
- jalankan:

```bash
psql "$DATABASE_URL" -f sql/schema.sql
```

Kalau `psql` tidak tersedia di runtime app, jalankan schema dari mesin lokal yang punya akses ke database Railway.

## Verifikasi setelah deploy
Cek hal berikut:

### Health check
Buka:

```text
https://your-app-domain/api/health
```

Harus mengembalikan JSON `ok: true`.

### Auth flow
Tes dari browser:
- Sign up akun baru
- Login
- Buka dashboard
- Tambahkan job demo
- Jalankan `seed demo` bila diperlukan

## Domain dan launch
Setelah app hidup:
- aktifkan domain Railway atau custom domain
- tambah Terms of Use
- tambah Privacy Policy
- perjelas positioning sebagai **media workflow untuk aset yang diizinkan**

## Catatan penting production
Build ini sudah cocok untuk **deploy awal / private beta**, tapi untuk production serius masih direkomendasikan:
- email verification
- reset password
- SSL database yang dikonfigurasi sesuai provider
- background worker terpisah
- object storage untuk asset file
- audit logging
- rate limiting yang lebih kuat
- billing dan quota enforcement

## Checklist cepat
- [ ] Repo ter-push ke GitHub
- [ ] PostgreSQL Railway dibuat
- [ ] `DATABASE_URL` terpasang
- [ ] `sql/schema.sql` sudah dijalankan
- [ ] `/api/health` lolos
- [ ] Sign up / login berhasil
- [ ] Domain aktif
