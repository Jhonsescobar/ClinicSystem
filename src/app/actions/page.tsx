'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { MedicalAction } from '@/types'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ActionFormData {
  name: string
  price: string
}

export default function ActionsPage() {
  const [actions, setActions] = useState<MedicalAction[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAction, setEditingAction] = useState<MedicalAction | null>(null)
  const [formData, setFormData] = useState<ActionFormData>({ name: '', price: '' })
  const [formError, setFormError] = useState('')
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [actionToDelete, setActionToDelete] = useState<MedicalAction | null>(null)
  
  // Toggle loading
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchActions()
  }, [])

  const fetchActions = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/actions')
      const data = await res.json()
      if (data.actions) {
        setActions(data.actions.sort((a: MedicalAction, b: MedicalAction) => 
          a.name.localeCompare(b.name)
        ))
      }
    } catch (error) {
      console.error('Failed to fetch actions:', error)
      toast.error('Gagal memuat data tindakan')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString('id-ID')}`
  }

  const parsePriceInput = (value: string): number => {
    // Remove non-numeric characters
    const cleaned = value.replace(/[^0-9]/g, '')
    return cleaned ? parseInt(cleaned, 10) : 0
  }

  const formatPriceInput = (value: number): string => {
    return value.toLocaleString('id-ID')
  }

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numericValue = parsePriceInput(value)
    setFormData({ ...formData, price: formatPriceInput(numericValue) })
  }

  const resetForm = () => {
    setFormData({ name: '', price: '' })
    setFormError('')
    setEditingAction(null)
  }

  const handleCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const handleEdit = (action: MedicalAction) => {
    setEditingAction(action)
    setFormData({
      name: action.name,
      price: formatPriceInput(action.price),
    })
    setFormError('')
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    
    // Validation
    if (!formData.name.trim()) {
      setFormError('Nama tindakan diperlukan')
      return
    }
    
    const price = parsePriceInput(formData.price)
    if (price < 0) {
      setFormError('Harga tidak boleh negatif')
      return
    }

    try {
      setSubmitting(true)
      
      const payload = {
        name: formData.name.trim(),
        price,
      }

      const url = editingAction 
        ? `/api/actions/${editingAction.id}`
        : '/api/actions'
      
      const method = editingAction ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.details?.[0]?.message || 'Gagal menyimpan tindakan')
      }

      toast.success(editingAction ? 'Tindakan berhasil diperbarui' : 'Tindakan berhasil dibuat')
      setDialogOpen(false)
      resetForm()
      fetchActions()
    } catch (error: any) {
      console.error('Submit error:', error)
      toast.error(error.message || 'Terjadi kesalahan')
      setFormError(error.message || 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (action: MedicalAction) => {
    setActionToDelete(action)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!actionToDelete) return

    try {
      const res = await fetch(`/api/actions/${actionToDelete.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghapus tindakan')
      }

      toast.success('Tindakan berhasil dihapus')
      setDeleteDialogOpen(false)
      setActionToDelete(null)
      fetchActions()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Terjadi kesalahan')
    }
  }

  const handleToggleActive = async (action: MedicalAction) => {
    try {
      setToggleLoading(action.id)
      
      const res = await fetch(`/api/actions/${action.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !action.isActive }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengupdate status')
      }

      toast.success(`Tindakan ${!action.isActive ? 'diaktifkan' : 'dinonaktifkan'}`)
      fetchActions()
    } catch (error: any) {
      console.error('Toggle error:', error)
      toast.error(error.message || 'Terjadi kesalahan')
    } finally {
      setToggleLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tindakan Medis</h1>
          <p className="text-muted-foreground">
            Kelola daftar tindakan medis dan harga
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Tindakan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Tindakan</CardTitle>
          <CardDescription>
            Total {actions.length} tindakan terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : actions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Belum ada tindakan medis</p>
              <p className="text-sm text-muted-foreground mt-2">
                Klik tombol "Tambah Tindakan" untuk membuat tindakan baru
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Tindakan</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell className="font-medium">{action.name}</TableCell>
                      <TableCell>{formatPrice(action.price)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={action.isActive}
                            onCheckedChange={() => handleToggleActive(action)}
                            disabled={toggleLoading === action.id}
                          />
                          <span className="text-sm">
                            {action.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(action)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(action)}
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingAction ? 'Edit Tindakan' : 'Tambah Tindakan Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingAction
                ? 'Ubah informasi tindakan medis'
                : 'Isi informasi untuk menambahkan tindakan medis baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Tindakan</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Konsultasi, Operasi Minor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Harga (Rp)</Label>
                <Input
                  id="price"
                  placeholder="Contoh: 150000"
                  value={formData.price}
                  onChange={handlePriceInputChange}
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Masukkan angka saja, format otomatis: {formatPrice(parsePriceInput(formData.price))}
                </p>
              </div>
              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAction ? 'Simpan Perubahan' : 'Tambah Tindakan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Hapus Tindakan"
        description={`Apakah Anda yakin ingin menghapus tindakan "${actionToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  )
}
