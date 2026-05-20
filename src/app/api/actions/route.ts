import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { formatZodError } from '@/lib/zod-helper'
import { z } from 'zod'

const actionSchema = z.object({
  name: z.string().min(1, 'Nama tindakan diperlukan'),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (isActive !== null) where.isActive = isActive === 'true'

    const actions = await db.medicalAction.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ actions })
  } catch (error: any) {
    console.error('Get actions error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth('SUPER_ADMIN')

    const body = await request.json()
    const data = actionSchema.parse(body)

    const action = await db.medicalAction.create({
      data,
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_ACTION',
        tableName: 'medical_actions',
        recordId: action.id,
        dataAfter: JSON.stringify(action),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({ action }, { status: 201 })
  } catch (error: any) {
    console.error('Create action error:', error)
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
