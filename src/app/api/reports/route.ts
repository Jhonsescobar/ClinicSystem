import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (date) {
      // Daily report
      const [transactions, attendances, locks] = await Promise.all([
        db.transaction.findMany({
          where: { transactionDate: date },
          include: {
            doctor: true,
            shift: true,
            transactionDetails: {
              include: { medicalAction: true },
            },
          },
        }),
        db.attendance.findMany({
          where: { attendanceDate: date },
          include: {
            doctor: true,
            shift: true,
          },
        }),
        db.dailyLock.findUnique({
          where: { lockDate: date },
        }),
      ])

      // Calculate totals per doctor
      const doctorStats = new Map<string, any>()
      transactions.forEach(t => {
        const doctorId = t.doctorId || 'unknown'
        const doctorName = t.doctor?.name || 'Unknown'
        
        if (!doctorStats.has(doctorId)) {
          doctorStats.set(doctorId, {
            doctorId,
            doctorName,
            transactionCount: 0,
            totalAmount: 0,
            actions: {},
          })
        }

        const stats = doctorStats.get(doctorId)
        stats.transactionCount++
        stats.totalAmount += t.totalAmount

        t.transactionDetails.forEach(td => {
          const actionName = td.medicalAction.name
          if (!stats.actions[actionName]) {
            stats.actions[actionName] = { count: 0, total: 0 }
          }
          stats.actions[actionName].count += td.quantity
          stats.actions[actionName].total += td.totalPrice
        })
      })

      const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0)

      return NextResponse.json({
        type: 'daily',
        date,
        totalRevenue,
        transactionCount: transactions.length,
        attendanceCount: attendances.length,
        isLocked: locks?.isLocked || false,
        doctorStats: Array.from(doctorStats.values()),
        transactions,
        attendances,
      })
    } else if (startDate && endDate) {
      // Monthly/range report
      const transactions = await db.transaction.findMany({
        where: {
          transactionDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          doctor: true,
          shift: true,
          transactionDetails: {
            include: { medicalAction: true },
          },
        },
      })

      const attendances = await db.attendance.findMany({
        where: {
          attendanceDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          doctor: true,
          shift: true,
        },
      })

      // Calculate doctor stats
      const doctorStats = new Map<string, any>()
      transactions.forEach(t => {
        const doctorId = t.doctorId || 'unknown'
        const doctorName = t.doctor?.name || 'Unknown'
        
        if (!doctorStats.has(doctorId)) {
          doctorStats.set(doctorId, {
            doctorId,
            doctorName,
            transactionCount: 0,
            totalAmount: 0,
            actions: {},
          })
        }

        const stats = doctorStats.get(doctorId)
        stats.transactionCount++
        stats.totalAmount += t.totalAmount

        t.transactionDetails.forEach(td => {
          const actionName = td.medicalAction.name
          if (!stats.actions[actionName]) {
            stats.actions[actionName] = { count: 0, total: 0 }
          }
          stats.actions[actionName].count += td.quantity
          stats.actions[actionName].total += td.totalPrice
        })
      })

      // Calculate action stats (most frequent)
      const actionStats = new Map<string, { count: number; total: number }>()
      transactions.forEach(t => {
        t.transactionDetails.forEach(td => {
          const actionName = td.medicalAction.name
          if (!actionStats.has(actionName)) {
            actionStats.set(actionName, { count: 0, total: 0 })
          }
          actionStats.get(actionName)!.count += td.quantity
          actionStats.get(actionName)!.total += td.totalPrice
        })
      })

      const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0)

      return NextResponse.json({
        type: 'monthly',
        startDate,
        endDate,
        totalRevenue,
        transactionCount: transactions.length,
        attendanceCount: attendances.length,
        doctorStats: Array.from(doctorStats.values()),
        actionStats: Array.from(actionStats.entries()).map(([name, data]) => ({
          actionName: name,
          ...data,
        })),
        transactions,
        attendances,
      })
    } else {
      return NextResponse.json(
        { error: 'Parameter date atau startDate+endDate diperlukan' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
