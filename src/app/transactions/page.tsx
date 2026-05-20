'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Edit2, Lock } from 'lucide-react'
import { Transaction, Doctor, Shift, MedicalAction } from '@/types'

interface TransactionAction {
  medicalActionId: string
  quantity: number
  medicalAction?: MedicalAction
}

interface TransactionFormData {
  doctorId: string
  shiftId: string
  actions: TransactionAction[]
}

export default function TransactionsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [medicalActions, setMedicalActions] = useState<MedicalAction[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState<TransactionFormData>({
    doctorId: '',
    shiftId: '',
    actions: [],
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [doctorsRes, shiftsRes, actionsRes, transactionsRes] = await Promise.all([
        fetch('/api/doctors?isActive=true'),
        fetch('/api/shifts'),
        fetch('/api/actions?isActive=true'),
        fetch(`/api/transactions?date=${selectedDate}`),
      ])

      const [doctorsData, shiftsData, actionsData, transactionsData] = await Promise.all([
        doctorsRes.json(),
        shiftsRes.json(),
        actionsRes.json(),
        transactionsRes.json(),
      ])

      if (doctorsData.doctors) setDoctors(doctorsData.doctors)
      if (shiftsData.shifts) setShifts(shiftsData.shifts)
      if (actionsData.actions) setMedicalActions(actionsData.actions)
      if (transactionsData.transactions) setTransactions(transactionsData.transactions)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addAction = () => {
    if (medicalActions.length === 0) return
    setForm({
      ...form,
      actions: [...form.actions, { medicalActionId: medicalActions[0].id, quantity: 1 }],
    })
  }

  const removeAction = (index: number) => {
    setForm({
      ...form,
      actions: form.actions.filter((_, i) => i !== index),
    })
  }

  const updateAction = (index: number, field: 'medicalActionId' | 'quantity', value: string | number) => {
    const newActions = [...form.actions]
    if (field === 'quantity') {
      newActions[index].quantity = Number(value)
    } else {
      newActions[index].medicalActionId = value as string
    }
    setForm({ ...form, actions: newActions })
  }

  const calculateTotal = (): number => {
    return form.actions.reduce((total, action) => {
      const medicalAction = medicalActions.find(ma => ma.id === action.medicalActionId)
      return total + (medicalAction?.price || 0) * action.quantity
    }, 0)
  }

  const handleSubmit = async () => {
    if (!form.doctorId || !form.shiftId || form.actions.length === 0) {
      alert('Mohon lengkapi semua data')
      return
    }

    try {
      const payload = {
        doctorId: form.doctorId,
        shiftId: form.shiftId,
        transactionDate: selectedDate,
        details: form.actions.map(action => ({
          medicalActionId: action.medicalActionId,
          quantity: action.quantity,
        })),
      }

      const url = editingId ? `/api/transactions/${editingId}` : '/api/transactions'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Gagal menyimpan transaksi')
      }

      // Close the confirmation dialog
      setConfirmDialogOpen(false)
      
      resetForm()
      await fetchData()
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan')
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id)
    setForm({
      doctorId: transaction.doctorId || '',
      shiftId: transaction.shiftId,
      actions: transaction.transactionDetails?.map(detail => ({
        medicalActionId: detail.medicalActionId,
        quantity: detail.quantity,
        medicalAction: detail.medicalAction,
      })) || [],
    })
  }

  const handleDelete = async (id: string) => {
    setPendingDeleteId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!pendingDeleteId) return

    try {
      const response = await fetch(`/api/transactions/${pendingDeleteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Gagal menghapus transaksi')
      }

      setDeleteDialogOpen(false)
      setPendingDeleteId(null)
      await fetchData()
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan')
    }
  }

  const resetForm = () => {
    setForm({
      doctorId: '',
      shiftId: '',
      actions: [],
    })
    setEditingId(null)
  }

  const formatIDR = (amount: number): string => {
    return `Rp ${amount.toLocaleString('id-ID')}`
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
        <h1 className="text-3xl font-bold">Transaksi</h1>
        <p className="text-muted-foreground">
          Catat tindakan medis dan pembayaran
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>
              {editingId ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
            </CardTitle>
            <CardDescription>
              {editingId ? 'Update data transaksi' : 'Catat transaksi baru'}
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
                disabled={!!editingId}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctor">Dokter</Label>
              <Select
                value={form.doctorId}
                onValueChange={(value) => setForm({ ...form, doctorId: value })}
              >
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Pilih dokter" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift">Shift</Label>
              <Select
                value={form.shiftId}
                onValueChange={(value) => setForm({ ...form, shiftId: value })}
              >
                <SelectTrigger id="shift">
                  <SelectValue placeholder="Pilih shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.name} ({shift.startTime} - {shift.endTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tindakan Medis</Label>
              <div className="space-y-2">
                {form.actions.map((action, index) => {
                  const medicalAction = medicalActions.find(ma => ma.id === action.medicalActionId)
                  const subtotal = medicalAction ? medicalAction.price * action.quantity : 0
                  
                  return (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Select
                          value={action.medicalActionId}
                          onValueChange={(value) => updateAction(index, 'medicalActionId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {medicalActions.map((ma) => (
                              <SelectItem key={ma.id} value={ma.id}>
                                {ma.name} ({formatIDR(ma.price)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min="1"
                          value={action.quantity}
                          onChange={(e) => updateAction(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAction(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addAction}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Tindakan
              </Button>
            </div>

            {form.actions.length > 0 && (
              <div className="space-y-2">
                <Label>Total</Label>
                <div className="text-2xl font-bold">
                  {formatIDR(calculateTotal())}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => setConfirmDialogOpen(true)}
                disabled={form.actions.length === 0}
              >
                {editingId ? 'Update' : 'Simpan'}
              </Button>
              {editingId && (
                <Button
                  variant="outline"
                  onClick={resetForm}
                >
                  Batal
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daftar Transaksi</CardTitle>
            <CardDescription>
              {transactions.length} transaksi tercatat
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Belum ada transaksi yang dicatat
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 rounded-lg border space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {transaction.doctor?.name || 'Dokter tidak dikenal'}
                          </p>
                          {transaction.isLocked && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              Dikunci
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {transaction.shift?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatIDR(transaction.totalAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.admin?.name}
                        </p>
                      </div>
                    </div>
                    
                    {transaction.transactionDetails && transaction.transactionDetails.length > 0 && (
                      <div className="pl-4 border-l-2 space-y-1">
                        {transaction.transactionDetails.map((detail) => (
                          <div key={detail.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {detail.quantity}x {detail.medicalAction?.name || '-'}
                            </span>
                            <span className="font-medium">
                              {formatIDR(detail.totalPrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {!transaction.isLocked && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(transaction)}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm Save Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingId ? 'Konfirmasi Update' : 'Konfirmasi Simpan'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {editingId ? 'Apakah Anda yakin ingin mengupdate transaksi ini?' : 'Apakah Anda yakin ingin menyimpan transaksi ini?'}
              <br />
              <br />
              <strong>Total: {formatIDR(calculateTotal())}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {editingId ? 'Update' : 'Simpan'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Hapus Transaksi"
        description="Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  )
}
