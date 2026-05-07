import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const attendanceSchema = z.object({
  doctorId: z.string().optional(),
  manualDoctorName: z.string().optional(),
  shiftId: z.string().min(1, 'Shift diperlukan'),
  photoUrl: z.string().min(1, 'Foto diperlukan'),
  attendanceDate: z.string().min(1, 'Tanggal diperlukan'),
  attendanceTime: z.string().min(1, 'Waktu diperlukan'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const doctorId = searchParams.get('doctorId')
    const shiftId = searchParams.get('shiftId')

    const where: any = {}
    if (date) where.attendanceDate = date
    if (doctorId) where.doctorId = doctorId
    if (shiftId) where.shiftId = shiftId

    const attendance = await db.attendance.findMany({
      where,
      include: {
        doctor: true,
        shift: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ attendance })
  } catch (error: any) {
    console.error('Get attendance error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const body = await request.json()
    const data = attendanceSchema.parse(body)

    if (!data.doctorId && !data.manualDoctorName) {
      return NextResponse.json(
        { error: 'Dokter atau nama dokter substitusi diperlukan' },
        { status: 400 }
      )
    }

    const attendance = await db.attendance.create({
      data: {
        ...data,
        adminId: user.id,
      },
      include: {
        doctor: true,
        shift: true,
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_ATTENDANCE',
        tableName: 'attendance',
        recordId: attendance.id,
        dataAfter: JSON.stringify(attendance),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({ attendance }, { status: 201 })
  } catch (error: any) {
    console.error('Create attendance error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
