import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { formatZodError } from '@/lib/zod-helper'
import { z } from 'zod'

const doctorSchema = z.object({
  name: z.string().min(1, 'Nama dokter diperlukan'),
  status: z.enum(['PERMANENT', 'SUBSTITUTE']).default('PERMANENT'),
})

// GET all doctors
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (status) where.status = status
    if (isActive !== null) where.isActive = isActive === 'true'

    const doctors = await db.doctor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ doctors })
  } catch (error: any) {
    console.error('Get doctors error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// POST create doctor
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth('SUPER_ADMIN')

    const body = await request.json()
    const data = doctorSchema.parse(body)

    const doctor = await db.doctor.create({
      data,
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_DOCTOR',
        tableName: 'doctors',
        recordId: doctor.id,
        dataAfter: JSON.stringify(doctor),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({ doctor }, { status: 201 })
  } catch (error: any) {
    console.error('Create doctor error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: formatZodError(error) },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500 }
    )
  }
}
