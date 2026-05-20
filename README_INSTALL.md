# Sistem Manajemen Klinik - Panduan Instalasi

## 📦 Cara Mengunduh Source Code

1. **Lihat di sudut atas jendela preview** (panel di sebelah kanan)
2. **Klik tombol download** (ikon download) di bagian atas
3. **Ekstrak file zip** yang diunduh
4. Baca panduan instalasi di bawah ini

---

## 🚀 Cara Menjalankan di Local (Komputer Anda)

### Persiapan yang Dibutuhkan:

1. **Node.js** (versi 20 atau lebih baru)
   - Download di: https://nodejs.org/
   - Setelah install, cek dengan terminal: `node --version`

2. **Bun** (package manager, lebih cepat)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```
   - Atau gunakan npm jika tidak ingin install bun

### Langkah-langkah Instalasi:

#### 1. Ekstrak File
```bash
# Masuk ke folder proyek
cd sistem-manajemen-klinik
```

#### 2. Install Dependencies
```bash
# Menggunakan Bun (rekomendasi)
bun install

# Atau menggunakan npm
npm install
```

#### 3. Setup Environment Variables
Buat file `.env` di root folder proyek:

```env
# Database
DATABASE_URL="file:./db/clinic.db"

# JWT Secret (ubah dengan string acak yang kuat untuk production)
JWT_SECRET="your-secret-key-change-in-production-min-32-characters-long"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### 4. Setup Database
```bash
# Push schema ke database
bun run db:push

# Seed data awal
bun run db:seed
```

#### 5. Jalankan Development Server
```bash
# Menggunakan Bun
bun run dev

# Atau menggunakan npm
npm run dev
```

#### 6. Buka di Browser
Aplikasi akan berjalan di: **http://localhost:3000**

---

## 🔑 Akun Default untuk Login

| Role       | Username    | Password |
|------------|-------------|----------|
| Super Admin| superadmin  | admin123 |
| Admin      | admin       | admin123 |

⚠️ **PENTING:** Ganti password default setelah login pertama untuk keamanan!

---

## 🌐 Cara Mengonlinekan (Deploy)

### Opsi 1: Vercel (Rekomendasi)

1. Buat akun di https://vercel.com
2. Push code ke GitHub
3. Import repository di Vercel
4. Setup environment variables:
   - `DATABASE_URL`: Gunakan database hosting (PostgreSQL/MySQL)
   - `JWT_SECRET`: String acak yang kuat
   - `NEXT_PUBLIC_APP_URL`: URL aplikasi Anda
5. Deploy!

### Opsi 2: VPS (DigitalOcean, AWS, dll)

1. Sewa VPS (minimal 1GB RAM)
2. Setup server dengan Node.js dan Nginx
3. Clone repository
4. Install dependencies dan setup database
5. Jalankan dengan PM2
6. Setup SSL dengan Certbot

---

## 🗄️ Database untuk Production

Untuk production, jangan gunakan SQLite file-based. Gunakan:

- **PostgreSQL**: Neon (https://neon.tech) atau Supabase (https://supabase.com)
- **MySQL**: PlanetScale (https://planetscale.com)

---

## 📋 Checklist Sebelum Online

- [ ] Ganti `JWT_SECRET` dengan string acak yang kuat (minimal 32 karakter)
- [ ] Gunakan database production (PostgreSQL/MySQL)
- [ ] Setup environment variables dengan benar
- [ ] Update `NEXT_PUBLIC_APP_URL` dengan domain production
- [ ] Ganti password default admin
- [ ] Test semua fitur
- [ ] Setup backup database

---

## 🔧 Troubleshooting

### Error: Module not found
```bash
rm -rf node_modules .next
bun install
```

### Database Error
```bash
rm -f db/clinic.db
bun run db:push
bun run db:seed
```

---

## 💡 Fitur Aplikasi

- ✅ Manajemen Dokter
- ✅ Manajemen Shift
- ✅ Pencatatan Kehadiran dengan foto selfie
- ✅ Pencatatan Transaksi
- ✅ Laporan Harian & Bulanan
- ✅ Audit Log
- ✅ Kunci Transaksi Harian
- ✅ Role-based Access (Super Admin & Admin)

---

## 📞 Bantuan

Jika mengalami masalah:
1. Cek console browser untuk error
2. Pastikan semua dependencies terinstall
3. Pastikan database sudah di-setup dengan benar
4. Cek environment variables

---

**Tech Stack:**
- Framework: Next.js 16
- Language: TypeScript 5
- Styling: Tailwind CSS 4 + shadcn/ui
- Database: Prisma ORM + SQLite (development)
- Auth: JWT
