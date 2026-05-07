'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CameraCapture } from '@/components/shared/CameraCapture'
import { Camera, Plus, Trash2 } from 'lucide-react'
import { Doctor, Shift, Attendance } from '@/types'

interface ActionItem {
  doctorId?: string
  manualDoctorName: string
  shiftId: string
  photoUrl: string
}

export default function AttendancePage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [tempPhoto, setTempPhoto] = useState<string | null>(null)

  const [form, setForm] = useState<ActionItem>({
    doctorId: '',
    manualDoctorName: '',
    shiftId: '',
    photoUrl: '',
  })

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [doctorsRes, shiftsRes, attendanceRes] = await Promise.all([
        fetch('/api/doctors?isActive=true'),
        fetch('/api/shifts'),
        fetch(`/api/attendance?date=${selectedDate}`),
      ])

      const [doctorsData, shiftsData, attendanceData] = await Promise.all([
        doctorsRes.json(),
        shiftsRes.json(),
        attendanceRes.json(),
      ])

      if (doctorsData.doctors) setDoctors(doctorsData.doctors)
      if (shiftsData.shifts) setShifts(shiftsData.shifts)
      if (attendanceData.attendance) setAttendanceList(attendanceData.attendance)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCapturePhoto = (imageData: string) => {
    setTempPhoto(imageData)
    setForm({ ...form, photoUrl: imageData })
  }

  const handleSubmit = async () => {
    if (!form.shiftId || !form.photoUrl) {
      alert('Mohon lengkapi semua data')
      return
    }

    if (!form.doctorId && !form.manualDoctorName) {
      alert('Mohon pilih dokter atau isi nama dokter substitusi')
      return
    }

    try {
      // Upload photo first
      const blob = await fetch(form.photoUrl).then(r => r.blob())
      const file = new File([blob], 'attendance.jpg', { type: 'image/jpeg' })
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: (() => {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('type', 'attendance')
          return formData
        })(),
      })

      const uploadData = await uploadRes.json()
      
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Upload failed')
      }

      // Create attendance
      const now = new Date()
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          photoUrl: uploadData.fileUrl,
          attendanceDate: selectedDate,
          attendanceTime: timeString,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Gagal mencatat kehadiran')
      }

      // Reset form
      setForm({
        doctorId: '',
        manualDoctorName: '',
        shiftId: '',
        photoUrl: '',
      })
      setTempPhoto(null)

      // Refresh data
      await fetchData()
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan')
    }
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
        <h1 className="text-3xl font-bold">Kehadiran Dokter</h1>
        <p className="text-muted-foreground">
          Catat kehadiran dokter setiap shift
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Catat Kehadiran</CardTitle>
            <CardDescription>
              Tambahkan kehadiran dokter baru
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
              <Label htmlFor="doctor">Dokter</Label>
              <Select
                value={form.doctorId}
                onValueChange={(value) => {
                  setForm({ ...form, doctorId: value, manualDoctorName: '' })
                }}
              >
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Pilih dokter" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name} ({doctor.status === 'PERMANENT' ? 'Tetap' : 'Pengganti'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manualDoctor">Nama Dokter Substitusi (Opsional)</Label>
              <Input
                id="manualDoctor"
                placeholder="Nama dokter substitusi"
                value={form.manualDoctorName}
                onChange={(e) => {
                  setForm({ ...form, manualDoctorName: e.target.value, doctorId: '' })
                }}
                disabled={!!form.doctorId}
              />
            </div>

            <div className="space-y-2">
              <Label>Foto Selfie</Label>
              {tempPhoto ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={tempPhoto}
                    alt="Captured"
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setTempPhoto(null)
                      setForm({ ...form, photoUrl: '' })
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full aspect-[4/3] border-dashed"
                  onClick={() => setCameraOpen(true)}
                >
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </Button>
              )}
            </div>

            <Button className="w-full" onClick={handleSubmit}>
              <Plus className="mr-2 h-4 w-4" />
              Catat Kehadiran
            </Button>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daftar Kehadiran</CardTitle>
            <CardDescription>
              {attendanceList.length} kehadiran tercatat
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceList.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Belum ada kehadiran yang dicatat
              </p>
            ) : (
              <div className="space-y-3">
                {attendanceList.map((attendance) => (
                  <div
                    key={attendance.id}
                    className="flex items-center gap-4 p-4 rounded-lg border"
                  >
                    <img
                      src={attendance.photoUrl}
                      alt={attendance.doctor?.name || attendance.manualDoctorName}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {attendance.doctor?.name || attendance.manualDoctorName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {attendance.shift?.name} • {attendance.attendanceTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {attendance.admin?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(attendance.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {cameraOpen && (
        <CameraCapture
          onCapture={handleCapturePhoto}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  )
}
