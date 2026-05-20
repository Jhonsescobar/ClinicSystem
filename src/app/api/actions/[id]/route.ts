import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { formatZodError } from '@/lib/zod-helper'
import { z } from 'zod'

const updateActionSchema = z.object({
  name: z.string().min(1, 'Nama tindakan diperlukan').optional(),
  price: z.number().min(0, 'Harga tidak boleh negatif').optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth('SUPER_ADMIN')

    const existingAction = await db.medicalAction.findUnique({
      where: { id },
    })

    if (!existingAction) {
      return NextResponse.json(
        { error: 'Tindakan tidak ditemukan' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const data = updateActionSchema.parse(body)

    const action = await db.medicalAction.update({
      where: { id },
      data,
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_ACTION',
        tableName: 'medical_actions',
        recordId: action.id,
        dataBefore: JSON.stringify(existingAction),
        dataAfter: JSON.stringify(action),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({ action })
  } catch (error: any) {
    console.error('Update action error:', error)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth('SUPER_ADMIN')

    const existingAction = await db.medicalAction.findUnique({
      where: { id },
    })

    if (!existingAction) {
      return NextResponse.json(
        { error: 'Tindakan tidak ditemukan' },
        { status: 404 }
      )
    }

    const action = await db.medicalAction.delete({
      where: { id },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_ACTION',
        tableName: 'medical_actions',
        recordId: action.id,
        dataBefore: JSON.stringify(existingAction),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({ message: 'Tindakan berhasil dihapus' })
  } catch (error: any) {
    console.error('Delete action error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500 }
    )
  }
}
