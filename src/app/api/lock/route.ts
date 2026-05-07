import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    let lock
    if (date) {
      lock = await db.dailyLock.findUnique({
        where: { lockDate: date },
      })
    } else {
      // Get today's lock status
      const today = new Date().toISOString().split('T')[0]
      lock = await db.dailyLock.findUnique({
        where: { lockDate: today },
      })
    }

    return NextResponse.json({ lock })
  } catch (error: any) {
    console.error('Get lock status error:', error)
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
    const { date, action } = body

    if (!date || !action) {
      return NextResponse.json(
        { error: 'Date dan action diperlukan' },
        { status: 400 }
      )
    }

    const existingLock = await db.dailyLock.findUnique({
      where: { lockDate: date },
    })

    let lock

    if (action === 'lock') {
      if (existingLock?.isLocked) {
        return NextResponse.json(
          { error: 'Tanggal ini sudah dikunci' },
          { status: 400 }
        )
      }

      lock = await db.dailyLock.upsert({
        where: { lockDate: date },
        create: {
          lockDate: date,
          isLocked: true,
          lockedAt: new Date(),
          lockedBy: user.id,
        },
        update: {
          isLocked: true,
          lockedAt: new Date(),
          lockedBy: user.id,
        },
      })

      // Lock all transactions for this date
      await db.transaction.updateMany({
        where: { transactionDate: date },
        data: { isLocked: true },
      })

      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOCK_DAY',
          tableName: 'daily_lock',
          recordId: lock.id,
          dataAfter: JSON.stringify({ date, isLocked: true }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })
    } else if (action === 'unlock') {
      if (!existingLock?.isLocked) {
        return NextResponse.json(
          { error: 'Tanggal ini belum dikunci' },
          { status: 400 }
        )
      }

      lock = await db.dailyLock.update({
        where: { lockDate: date },
        data: {
          isLocked: false,
          unlockedAt: new Date(),
          unlockedBy: user.id,
        },
      })

      // Unlock all transactions for this date
      await db.transaction.updateMany({
        where: { transactionDate: date },
        data: { isLocked: false },
      })

      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'UNLOCK_DAY',
          tableName: 'daily_lock',
          recordId: lock.id,
          dataBefore: JSON.stringify({ date, isLocked: true }),
          dataAfter: JSON.stringify({ date, isLocked: false }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })
    } else {
      return NextResponse.json(
        { error: 'Action harus "lock" atau "unlock"' },
        { status: 400 }
      )
    }

    return NextResponse.json({ lock })
  } catch (error: any) {
    console.error('Toggle lock error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500 }
    )
  }
}
