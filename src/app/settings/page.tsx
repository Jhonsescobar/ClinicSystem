'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { Download, Lock, Unlock, AlertCircle } from 'lucide-react'

interface DailyLock {
  id: string
  lockDate: string
  isLocked: boolean
  lockedAt?: string
  unlockedAt?: string
}

interface AuditLog {
  id: string
  userId: string
  action: string
  tableName: string
  timestamp: string
  user?: {
    id: string
    name: string
    email: string
  }
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [lockStatus, setLockStatus] = useState<DailyLock | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [tableFilter, setTableFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [locking, setLocking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [clinicSettings, setClinicSettings] = useState({
    name: 'Klinik Sehat',
    address: 'Jl. Kesehatan No. 123',
    phone: '021-12345678',
  })

  useEffect(() => {
    fetchData()
  }, [selectedDate, tableFilter])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [lockRes, auditRes] = await Promise.all([
        fetch(`/api/lock?date=${selectedDate}`),
        fetch(`/api/audit-logs?limit=50${tableFilter && tableFilter !== 'all' ? `&tableName=${tableFilter}` : ''}`),
      ])

      const [lockData, auditData] = await Promise.all([
        lockRes.json(),
        auditRes.json(),
      ])

      if (lockData.lock) setLockStatus(lockData.lock)
      if (auditData.logs) setAuditLogs(auditData.logs)
    } catch (err: any) {
      console.error('Failed to fetch data:', err)
      setError('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleLockToggle = async (action: 'lock' | 'unlock') => {
    if (!confirm(
      action === 'lock'
        ? 'Apakah Anda yakin ingin mengunci semua transaksi untuk tanggal ini?'
        : 'Apakah Anda yakin ingin membuka kunci transaksi untuk tanggal ini?'
    )) {
      return
    }

    setLocking(true)
    try {
      const response = await fetch('/api/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          action,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal mengubah status kunci')
      }

      const data = await response.json()
      setLockStatus(data.lock)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLocking(false)
    }
  }

  const handleSaveSettings = () => {
    alert('Pengaturan berhasil disimpan (simulasi)')
  }

  const handleExportCode = () => {
    const guide = `
=== PANDUAN DOWNLOAD & INSTALL SISTEM MANAJEMEN KLINIK ===

CARA MENGUNDUH:
1. Lihat di sudut atas jendela preview (sebelah kanan)
2. Klik tombol download (ikon download)
3. Ekstrak file zip yang diunduh

CARA INSTALL DI LOCAL:
1. cd sistem-manajemen-klinik
2. npm install
3. Buat file .env dengan isi:
   DATABASE_URL="file:./db/clinic.db"
   JWT_SECRET="your-secret-key-min-32-characters"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
4. npx prisma db push
5. npx tsx prisma/seed.ts
6. npx next dev -p 3000
7. Buka http://localhost:3000

AKUN DEFAULT:
- Super Admin: admin@klinik.com / admin123
- Admin: staff@klinik.com / user123

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

  // Don't render if user is not loaded yet
  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchData}>Coba Lagi</Button>
        </div>
      </div>
    )
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

        {/* Daily Lock Management */}
        {user?.role === 'SUPER_ADMIN' && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Kunci Transaksi Harian
              </CardTitle>
              <CardDescription>
                Kelola kunci transaksi untuk setiap tanggal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Tanggal</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              {!loading && (
                <>
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted">
                    <div className="flex items-center gap-3">
                      {lockStatus?.isLocked ? (
                        <Lock className="h-5 w-5 text-destructive" />
                      ) : (
                        <Unlock className="h-5 w-5 text-green-600" />
                      )}
                      <div>
                        <Badge variant={lockStatus?.isLocked ? 'destructive' : 'default'}>
                          {lockStatus?.isLocked ? 'DIKUNCI' : 'TERBUKA'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      {lockStatus?.lockedAt && (
                        <p className="text-muted-foreground">
                          Dikunci: {new Date(lockStatus.lockedAt).toLocaleString('id-ID')}
                        </p>
                      )}
                      {lockStatus?.unlockedAt && (
                        <p className="text-muted-foreground">
                          Dibuka: {new Date(lockStatus.unlockedAt).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!lockStatus?.isLocked ? (
                      <Button
                        className="flex-1"
                        variant="destructive"
                        onClick={() => handleLockToggle('lock')}
                        disabled={locking}
                      >
                        {locking ? 'Loading...' : 'Kunci Transaksi'}
                      </Button>
                    ) : (
                      <Button
                        className="flex-1"
                        onClick={() => handleLockToggle('unlock')}
                        disabled={locking}
                      >
                        {locking ? 'Loading...' : 'Buka Kunci'}
                      </Button>
                    )}
                  </div>

                  {lockStatus?.isLocked && (
                    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 flex items-start gap-2 text-sm text-yellow-800">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>
                        Semua transaksi pada tanggal ini telah dikunci. Admin tidak dapat mengedit atau menghapus transaksi.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* System Settings */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Pengaturan Klinik</CardTitle>
            <CardDescription>
              Informasi dasar klinik
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinicName">Nama Klinik</Label>
              <Input
                id="clinicName"
                value={clinicSettings.name}
                onChange={(e) => setClinicSettings({ ...clinicSettings, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicAddress">Alamat</Label>
              <Textarea
                id="clinicAddress"
                value={clinicSettings.address}
                onChange={(e) => setClinicSettings({ ...clinicSettings, address: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicPhone">Telepon</Label>
              <Input
                id="clinicPhone"
                value={clinicSettings.phone}
                onChange={(e) => setClinicSettings({ ...clinicSettings, phone: e.target.value })}
              />
            </div>

            <Button className="w-full" onClick={handleSaveSettings}>
              Simpan Pengaturan
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>
            Riwayat aktivitas sistem
          </CardDescription>
          <div className="flex items-center gap-2">
            <Label htmlFor="tableFilter">Filter Tabel:</Label>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger id="tableFilter" className="w-[200px]">
                <SelectValue placeholder="Semua tabel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua tabel</SelectItem>
                <SelectItem value="doctors">Dokter</SelectItem>
                <SelectItem value="transactions">Transaksi</SelectItem>
                <SelectItem value="attendance">Kehadiran</SelectItem>
                <SelectItem value="medical_actions">Tindakan</SelectItem>
                <SelectItem value="users">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Belum ada aktivitas
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Aksi</TableHead>
                    <TableHead>Tabel</TableHead>
                    <TableHead>Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.user?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.tableName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
