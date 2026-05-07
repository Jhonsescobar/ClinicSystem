'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Doctor } from '@/types'
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react'

interface DoctorFormData {
  name: string
  status: 'PERMANENT' | 'SUBSTITUTE'
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [formData, setFormData] = useState<DoctorFormData>({
    name: '',
    status: 'PERMANENT',
  })

  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null)

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/doctors')
      const data = await response.json()

      if (data.doctors) {
        setDoctors(data.doctors)
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingDoctor(null)
    setFormData({ name: '', status: 'PERMANENT' })
    setDialogOpen(true)
  }

  const openEditDialog = (doctor: Doctor) => {
    setEditingDoctor(doctor)
    setFormData({
      name: doctor.name,
      status: doctor.status,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Nama dokter diperlukan')
      return
    }

    setSubmitting(true)
    try {
      const url = editingDoctor ? `/api/doctors/${editingDoctor.id}` : '/api/doctors'
      const method = editingDoctor ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Gagal menyimpan dokter')
      }

      setDialogOpen(false)
      await fetchDoctors()
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const openDeleteDialog = (doctor: Doctor) => {
    setDoctorToDelete(doctor)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!doctorToDelete) return

    try {
      const response = await fetch(`/api/doctors/${doctorToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Gagal menghapus dokter')
      }

      setDeleteDialogOpen(false)
      setDoctorToDelete(null)
      await fetchDoctors()
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan')
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'PERMANENT') {
      return <Badge className="bg-green-500 hover:bg-green-600">Tetap</Badge>
    }
    return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pengganti</Badge>
  }

  const getActiveBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="outline" className="text-green-600 border-green-600">Aktif</Badge>
    }
    return <Badge variant="outline" className="text-gray-600 border-gray-600">Non-aktif</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kelola Dokter</h1>
          <p className="text-muted-foreground">
            Tambah, edit, atau hapus data dokter
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Dokter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Dokter</CardTitle>
          <CardDescription>
            {doctors.length} dokter terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {doctors.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Belum ada dokter yang terdaftar
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aktif</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell className="font-medium">{doctor.name}</TableCell>
                      <TableCell>{getStatusBadge(doctor.status)}</TableCell>
                      <TableCell>{getActiveBadge(doctor.isActive)}</TableCell>
                      <TableCell>
                        {new Date(doctor.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(doctor)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(doctor)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDoctor ? 'Edit Dokter' : 'Tambah Dokter Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingDoctor
                ? 'Edit data dokter yang ada'
                : 'Tambahkan dokter baru ke sistem'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Dokter</Label>
              <Input
                id="name"
                placeholder="Masukkan nama dokter"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'PERMANENT' | 'SUBSTITUTE') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERMANENT">Dokter Tetap</SelectItem>
                  <SelectItem value="SUBSTITUTE">Dokter Pengganti</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingDoctor ? 'Simpan Perubahan' : 'Tambah Dokter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Hapus Dokter?"
        description={`Apakah Anda yakin ingin menghapus dokter "${doctorToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
