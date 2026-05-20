import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { formatZodError } from '@/lib/zod-helper'
import { z } from 'zod'

const updateTransactionDetailSchema = z.object({
  medicalActionId: z.string().min(1, 'Tindakan diperlukan'),
  quantity: z.number().min(1, 'Jumlah minimal 1'),
})

const updateTransactionSchema = z.object({
  doctorId: z.string().optional(),
  details: z.array(updateTransactionDetailSchema).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()

    const transaction = await db.transaction.findUnique({
      where: { id },
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
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ transaction })
  } catch (error: any) {
    console.error('Get transaction error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()

    const existingTransaction = await db.transaction.findUnique({
      where: { id },
      include: {
        transactionDetails: true,
      },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    if (existingTransaction.isLocked && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Transaksi ini sudah dikunci. Hubungi Super Admin.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { doctorId, details } = updateTransactionSchema.parse(body)

    let updateData: any = {}
    if (doctorId !== undefined) updateData.doctorId = doctorId

    let totalAmount = existingTransaction.totalAmount

    if (details) {
      // Delete old details
      await db.transactionDetail.deleteMany({
        where: { transactionId: id },
      })

      // Recalculate and create new details
      const medicalActionIds = details.map(d => d.medicalActionId)
      const medicalActions = await db.medicalAction.findMany({
        where: { id: { in: medicalActionIds } },
      })

      const actionMap = new Map(medicalActions.map(a => [a.id, a]))

      totalAmount = 0
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

      updateData.totalAmount = totalAmount
      updateData.transactionDetails = {
        create: transactionDetailsData,
      }
    }

    const transaction = await db.transaction.update({
      where: { id },
      data: updateData,
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
        action: 'UPDATE_TRANSACTION',
        tableName: 'transactions',
        recordId: transaction.id,
        dataBefore: JSON.stringify(existingTransaction),
        dataAfter: JSON.stringify(transaction),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({ transaction })
  } catch (error: any) {
    console.error('Update transaction error:', error)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()

    const existingTransaction = await db.transaction.findUnique({
      where: { id },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    if (existingTransaction.isLocked && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Transaksi ini sudah dikunci. Hubungi Super Admin.' },
        { status: 403 }
      )
    }

    await db.transaction.delete({
      where: { id },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_TRANSACTION',
        tableName: 'transactions',
        recordId: id,
        dataBefore: JSON.stringify(existingTransaction),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({ message: 'Transaksi berhasil dihapus' })
  } catch (error: any) {
    console.error('Delete transaction error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
