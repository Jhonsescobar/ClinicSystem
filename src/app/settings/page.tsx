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
import { DailyLock, AuditLog, User } from '@/types'
import { Lock, Unlock, AlertCircle, Download } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [lockStatus, setLockStatus] = useState<DailyLock | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [tableFilter, setTableFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [locking, setLocking] = useState(false)

  const [clinicSettings, setClinicSettings] = useState({
    name: 'Klinik Sehat',
    address: 'Jl. Kesehatan No. 123',
    phone: '021-12345678',
  })

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [lockRes, auditRes] = await Promise.all([
        fetch(`/api/lock?date=${selectedDate}`),
        fetch(`/api/audit-logs?limit=50${tableFilter ? `&tableName=${tableFilter}` : ''}`),
      ])

      const [lockData, auditData] = await Promise.all([
        lockRes.json(),
        auditRes.json(),
      ])

      if (lockData.lock) setLockStatus(lockData.lock)
      if (auditData.logs) setAuditLogs(auditData.logs)
    } catch (error) {
      console.error('Failed to fetch data:', error)
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
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLocking(false)
    }
  }

  const handleSaveSettings = () => {
    alert('Pengaturan berhasil disimpan (simulasi)')
  }

  const handleExportCode = async () => {
    try {
      alert('Untuk mengunduh seluruh source code, silakan klik tombol download di sudut atas jendela preview (di sebelah kanan), kemudian ikuti panduan instalasi yang telah saya jelaskan sebelumnya.')

      const response = await fetch('/api/export-code')
      if (!response.ok) {
        throw new Error('Gagal mengekspor kode')
      }

      const data = await response.json()

      // Show instructions in alert
      const message = `
${data.description}

${data.message}

Tech Stack:
- Framework: ${data.techStack.framework}
- Language: ${data.techStack.language}
- Styling: ${data.techStack.styling}
- Database: ${data.techStack.database}
- Auth: ${data.techStack.auth}

Cara Install:
1. Ekstrak file zip yang diunduh dari sudut atas preview
2. cd sistem-manajemen-klinik
3. bun install
4. Buat file .env dengan konfigurasi database dan JWT secret
5. bun run db:push
6. bun run db:seed
7. bun run dev
      `

      alert(message.trim())
    } catch (error: any) {
      console.error('Export error:', error)
      alert(error.message || 'Terjadi kesalahan saat mengekspor kode. Gunakan tombol download di sudut atas preview panel.')
    }
  }

  // Don't render if user is not loaded yet
  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
                <SelectItem value="">Semua tabel</SelectItem>
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
          {auditLogs.length === 0 ? (
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
