# Klinik System - Sistem Manajemen Klinik Internal

Sistem manajemen klinik lengkap untuk mencatat kehadiran dokter, transaksi tindakan medis, pendapatan, dan laporan harian/bulanan.

## 🚀 Fitur Utama

### ✅ Authentication & Authorization
- Login sistem dengan JWT
- Role-based access control (RBAC)
- Dua role: **Super Admin** dan **Admin**
- Password hashing dengan bcrypt

### 👨‍⚕️ Manajemen Dokter
- CRUD dokter lengkap
- Status: Permanent / Substitute
- Active/Inactive toggle
- Dokter permanen dan pengganti

### ⏰ Sistem Shift
- 3 shift pre-configured:
  - Shift 1: 08:00 - 14:00
  - Shift 2: 14:00 - 20:00
  - Shift 3: 20:00 - 08:00

### 📷 Sistem Kehadiran
- Pencatatan kehadiran dokter per shift
- Ambil foto selfie untuk verifikasi
- Support dokter substitusi
- Simpan foto ke server

### 💉 Tindakan Medis
- CRUD tindakan medis
- Atur harga tindakan
- Active/Inactive toggle
- Pre-loaded tindakan: Konsultasi, Operasi Minor, Jahit Luka, Bersihkan Luka

### 💰 Sistem Transaksi
- Buat, edit, hapus transaksi
- Multiple tindakan medis per transaksi
- Kalkulasi total otomatis (jumlah × harga)
- Proteksi kunci untuk hari terkunci
- Konfirmasi sebelum simpan

### 📊 Laporan & Analitik
- **Laporan Harian:**
  - Filter tanggal
  - Statistik: pendapatan, transaksi, kehadiran
  - Breakdown per dokter
  - Status kunci
  - Export Excel

- **Laporan Bulanan:**
  - Filter rentang tanggal
  - Statistik lengkap
  - Breakdown per dokter
  - Tindakan paling sering
  - Export Excel

### 🔐 Kunci Transaksi Harian
- Kunci/buka transaksi per tanggal
- Mencegah edit/hapus hari terkunci
- Hanya Super Admin yang bisa mengunci/membuka
- Audit trail lengkap

### 📝 Audit Logging
- Tracking semua operasi kritis
- Filter berdasarkan tabel
- Menampilkan user, aksi, tabel, timestamp

### 👥 Manajemen User (Super Admin)
- CRUD user lengkap
- Role management
- Self-deletion prevention
- Password security

### ⚙️ Pengaturan Sistem
- Pengaturan klinik (nama, alamat, telepon)
- Manajemen kunci transaksi harian
- Viewer audit log

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Database:** SQLite dengan Prisma ORM
- **Authentication:** JWT dengan bcrypt
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui (New York style)
- **Icons:** Lucide React
- **Excel Export:** exceljs

## 📦 Instalasi

```bash
# Install dependencies
bun install

# Setup database
bun run db:push

# Seed database dengan data demo
bunx tsx prisma/seed.ts

# Jalankan development server
bun run dev
```

## 🔑 Login Credentials

### Super Admin
- Email: `admin@klinik.com`
- Password: `admin123`
- Akses: Semua fitur

### Admin
- Email: `staff@klinik.com`
- Password: `user123`
- Akses: Kehadiran, Transaksi, Laporan

## 📁 Struktur Project

```
/home/z/my-project/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts               # Database seeding
├── src/
│   ├── app/
│   │   ├── api/              # Backend API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── doctors/      # Doctors CRUD
│   │   │   ├── shifts/       # Shifts management
│   │   │   ├── attendance/   # Attendance recording
│   │   │   ├── actions/      # Medical actions
│   │   │   ├── transactions/ # Transactions
│   │   │   ├── reports/      # Reports & export
│   │   │   ├── audit-logs/   # Audit logging
│   │   │   ├── lock/         # Daily lock management
│   │   │   ├── users/        # User management
│   │   │   └── upload/       # File upload
│   │   ├── attendance/       # Attendance page
│   │   ├── transactions/    # Transactions page
│   │   ├── reports/         # Reports page
│   │   ├── doctors/         # Doctors management
│   │   ├── actions/         # Medical actions
│   │   ├── users/           # User management
│   │   ├── settings/        # Settings page
│   │   ├── dashboard/       # Dashboard
│   │   └── login/           # Login page
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   └── shared/          # Shared app components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   └── types/               # TypeScript types
├── uploads/                 # File uploads (attendance photos)
└── db/                     # Database files
```

## 📊 Database Schema

### Tabel Utama:
- `users` - User accounts dengan role
- `doctors` - Data dokter (permanent/substitute)
- `shifts` - Shift kerja (3 shift)
- `attendance` - Kehadiran dokter dengan foto
- `medical_actions` - Tindakan medis dengan harga
- `transactions` - Transaksi harian
- `transaction_details` - Detail tindakan per transaksi
- `daily_lock` - Kunci transaksi harian
- `audit_logs` - Riwayat aktivitas sistem

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Doctors
- `GET /api/doctors` - List all doctors
- `POST /api/doctors` - Create doctor (Super Admin)
- `PUT /api/doctors/:id` - Update doctor (Super Admin)
- `DELETE /api/doctors/:id` - Delete doctor (Super Admin)

### Shifts
- `GET /api/shifts` - List all shifts
- `POST /api/shifts` - Create shift (Super Admin)

### Attendance
- `GET /api/attendance` - List attendance
- `POST /api/attendance` - Record attendance

### Medical Actions
- `GET /api/actions` - List medical actions
- `POST /api/actions` - Create action (Super Admin)
- `PUT /api/actions/:id` - Update action (Super Admin)
- `DELETE /api/actions/:id` - Delete action (Super Admin)

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Reports
- `GET /api/reports` - Get reports data
- `GET /api/reports/export` - Export Excel

### Lock
- `GET /api/lock` - Get lock status
- `POST /api/lock` - Toggle lock (Super Admin)

### Audit Logs
- `GET /api/audit-logs` - List audit logs

### Users
- `GET /api/users` - List users (Super Admin)
- `POST /api/users` - Create user (Super Admin)
- `PUT /api/users/:id` - Update user (Super Admin)
- `DELETE /api/users/:id` - Delete user (Super Admin)

### Upload
- `POST /api/upload` - Upload file (photo)

## 🎨 UI/UX Features

- **Responsive Design:** Mobile-first dengan Tailwind CSS
- **Dark Mode Ready:** Tema system support
- **Loading States:** Spinners dan skeletons untuk async operations
- **Error Handling:** Clear error messages
- **Confirmation Dialogs:** Untuk semua operasi kritis
- **Toast Notifications:** Feedback user
- **Real-time Updates:** Auto-refresh data
- **Camera Integration:** Selfie capture untuk attendance
- **Excel Export:** Download laporan dalam format Excel
- **Currency Formatting:** Format Rupiah (Rp 1.000.000)
- **Indonesian Localization:** UI dalam Bahasa Indonesia

## 🔒 Security Features

- **Password Hashing:** bcrypt untuk password storage
- **JWT Authentication:** Secure token-based auth
- **Role-Based Access:** RBAC untuk setiap endpoint
- **CORS Protection:** Terbatas ke localhost
- **Input Validation:** Zod validation untuk semua input
- **SQL Injection Protection:** Prisma ORM
- **XSS Protection:** React escaping
- **Audit Logging:** Semua operasi kritical tercatat

## 📱 Akses Aplikasi

Aplikasi berjalan di development server:
- URL: Preview Panel di sebelah kanan
- Port: 3000
- Tombol: "Open in New Tab" untuk buka di tab baru

## 🎯 Role Permissions

| Fitur | Super Admin | Admin |
|--------|-------------|--------|
| Dashboard | ✅ | ✅ |
| Kehadiran | ✅ | ✅ |
| Transaksi | ✅ | ✅ |
| Laporan | ✅ | ✅ |
| Dokter | ✅ | ❌ |
| Tindakan | ✅ | ❌ |
| Users | ✅ | ❌ |
| Settings | ✅ | ❌ |
| Kunci Transaksi | ✅ | ❌ |

## 📝 Catatan

- Sistem menggunakan **SQLite** untuk penyimpanan data (file-based)
- Semua transaksi hari sebelumnya bisa dikunci oleh Super Admin
- Admin tidak bisa mengedit/hapus transaksi yang sudah dikunci
- Foto attendance disimpan di folder `uploads/attendance/`
- Excel export menggunakan library `exceljs`
- Development server sudah berjalan otomatis

## 🚀 Deployment Notes

Untuk deployment:
1. Set `DATABASE_URL` environment variable
2. Set `JWT_SECRET` environment variable
3. Run `bun run build`
4. Run `bun start`

## 📞 Support

Untuk pertanyaan atau issue, hubungi tim development.

---

**Versi:** 1.0.0
**Status:** Production Ready ✅
**Last Updated:** 2025
