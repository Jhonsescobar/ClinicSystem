import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { formatZodError } from '@/lib/zod-helper'
import { z } from 'zod'

const transactionDetailSchema = z.object({
  medicalActionId: z.string().min(1, 'Tindakan diperlukan'),
  quantity: z.number().min(1, 'Jumlah minimal 1'),
})

const transactionSchema = z.object({
  doctorId: z.string().optional(),
  shiftId: z.string().min(1, 'Shift diperlukan'),
  transactionDate: z.string().min(1, 'Tanggal transaksi diperlukan'),
  details: z.array(transactionDetailSchema).min(1, 'Minimal satu tindakan'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const doctorId = searchParams.get('doctorId')
    const shiftId = searchParams.get('shiftId')
    const isLocked = searchParams.get('isLocked')

    const where: any = {}
    if (date) where.transactionDate = date
    if (doctorId) where.doctorId = doctorId
    if (shiftId) where.shiftId = shiftId
    if (isLocked !== null) where.isLocked = isLocked === 'true'

    const transactions = await db.transaction.findMany({
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
        transactionDetails: {
          include: {
            medicalAction: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ transactions })
  } catch (error: any) {
    console.error('Get transactions error:', error)
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
    const { doctorId, shiftId, transactionDate, details } = transactionSchema.parse(body)

    // Check if date is locked
    const lock = await db.dailyLock.findUnique({
      where: { lockDate: transactionDate },
    })

    if (lock?.isLocked) {
      return NextResponse.json(
        { error: 'Tanggal ini sudah dikunci. Hubungi Super Admin.' },
        { status: 403 }
      )
    }

    // Get medical actions to calculate prices
    const medicalActionIds = details.map(d => d.medicalActionId)
    const medicalActions = await db.medicalAction.findMany({
      where: { id: { in: medicalActionIds } },
    })

    const actionMap = new Map(medicalActions.map(a => [a.id, a]))

    // Calculate totals
    let totalAmount = 0
    const transactionDetailsData = details.map(detail => {
      const action = actionMap.get(detail.medicalActionId)
      if (!action) {
        throw new Error(`Tindakan dengan ID ${detail.medicalActionId} tidak ditemukan`)
      }

      const unitPrice = action.price
      const totalPrice = unitPrice * detail.quantity
      totalAmount += totalPrice

      return {
        medicalActionId: detail.medicalActionId,
        quantity: detail.quantity,
        unitPrice,
        totalPrice,
      }
    })

    const transaction = await db.transaction.create({
      data: {
        doctorId,
        shiftId,
        transactionDate,
        totalAmount,
        adminId: user.id,
        transactionDetails: {
          create: transactionDetailsData,
        },
      },
      include: {
        doctor: true,
        shift: true,
        transactionDetails: {
          include: {
            medicalAction: true,
          },
        },
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_TRANSACTION',
        tableName: 'transactions',
        recordId: transaction.id,
        dataAfter: JSON.stringify(transaction),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error: any) {
    console.error('Create transaction error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: formatZodError(error) },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
