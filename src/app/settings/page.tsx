'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export default function SettingsPage() {
  const handleExportCode = () => {
    const guide = `
=== PANDUAN DOWNLOAD & INSTALL SISTEM MANAJEMEN KLINIK ===

CARA MENGUNDUH:
1. Lihat di sudut atas jendela preview (sebelah kanan)
2. Klik tombol download (ikon download)
3. Ekstrak file zip yang diunduh

CARA INSTALL DI LOCAL:
1. cd sistem-manajemen-klinik
2. bun install (atau npm install)
3. Buat file .env dengan isi:
   DATABASE_URL="file:./db/clinic.db"
   JWT_SECRET="your-secret-key-change-in-production-min-32-characters"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
4. bun run db:push
5. bun run db:seed
6. bun run dev
7. Buka http://localhost:3000

AKUN DEFAULT:
- Super Admin: superadmin / admin123
- Admin: admin / admin123

TECH STACK:
- Framework: Next.js 16
- Language: TypeScript 5
- Styling: Tailwind CSS 4 + shadcn/ui
- Database: Prisma ORM + SQLite
- Auth: JWT

CARA DEPLOY KE ONLINE:
- Vercel (rekomendasi, gratis): https://vercel.com
- VPS (DigitalOcean, AWS, dll): Install Node.js, setup Nginx, PM2
    `.trim()

    alert(guide)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola pengaturan sistem dan akses
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Export Code */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Ekspor Kode Lengkap
            </CardTitle>
            <CardDescription>
              Panduan cara mengunduh dan menginstall aplikasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
              <p className="font-medium mb-2">Cara Mengunduh Source Code:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Lihat di sudut atas jendela preview (sebelah kanan)</li>
                <li>Klik tombol download (ikon download)</li>
                <li>Ekstrak file zip yang diunduh</li>
                <li>Ikuti panduan instalasi yang muncul setelah klik tombol di bawah</li>
              </ol>
            </div>
            <Button className="w-full" onClick={handleExportCode}>
              <Download className="mr-2 h-4 w-4" />
              Lihat Panduan Install
            </Button>
          </CardContent>
        </Card>

        {/* Placeholders for other cards - simplified */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fitur Lainnya</CardTitle>
            <CardDescription>
              Fitur pengaturan lainnya sedang dalam maintenance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Fitur-fitur seperti Kunci Transaksi Harian, Pengaturan Klinik, dan Audit Log akan segera tersedia kembali.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
