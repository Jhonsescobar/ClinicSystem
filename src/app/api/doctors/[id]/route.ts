import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const updateDoctorSchema = z.object({
  name: z.string().min(1, 'Nama dokter diperlukan').optional(),
  status: z.enum(['PERMANENT', 'SUBSTITUTE']).optional(),
  isActive: z.boolean().optional(),
})

// GET single doctor
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    const doctor = await db.doctor.findUnique({
      where: { id: params.id },
    })

    if (!doctor) {
      return NextResponse.json(
        { error: 'Dokter tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ doctor })
  } catch (error: any) {
    console.error('Get doctor error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// PUT update doctor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth('SUPER_ADMIN')

    const existingDoctor = await db.doctor.findUnique({
      where: { id: params.id },
    })

    if (!existingDoctor) {
      return NextResponse.json(
        { error: 'Dokter tidak ditemukan' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const data = updateDoctorSchema.parse(body)

    const doctor = await db.doctor.update({
      where: { id: params.id },
      data,
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_DOCTOR',
        tableName: 'doctors',
        recordId: doctor.id,
        dataBefore: JSON.stringify(existingDoctor),
        dataAfter: JSON.stringify(doctor),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({ doctor })
  } catch (error: any) {
    console.error('Update doctor error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500 }
    )
  }
}

// DELETE doctor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth('SUPER_ADMIN')

    const existingDoctor = await db.doctor.findUnique({
      where: { id: params.id },
    })

    if (!existingDoctor) {
      return NextResponse.json(
        { error: 'Dokter tidak ditemukan' },
        { status: 404 }
      )
    }

    const doctor = await db.doctor.delete({
      where: { id: params.id },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_DOCTOR',
        tableName: 'doctors',
        recordId: doctor.id,
        dataBefore: JSON.stringify(existingDoctor),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({ message: 'Dokter berhasil dihapus' })
  } catch (error: any) {
    console.error('Delete doctor error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500 }
    )
  }
}
