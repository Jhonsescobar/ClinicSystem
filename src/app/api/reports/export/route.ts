import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { Workbook } from 'exceljs'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (date) {
      // Export daily report
      const [transactions, attendances] = await Promise.all([
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
      ])

      const workbook = new Workbook()
      const worksheet = workbook.addWorksheet(`Laporan Harian - ${date}`)

      worksheet.columns = [
        { header: 'Waktu', key: 'time' },
        { header: 'Dokter', key: 'doctor' },
        { header: 'Shift', key: 'shift' },
        { header: 'Tindakan', key: 'actions' },
        { header: 'Total', key: 'total' },
      ]

      transactions.forEach(t => {
        const actionsList = t.transactionDetails
          .map(td => `${td.medicalAction.name} x${td.quantity}`)
          .join(', ')
        
        worksheet.addRow({
          time: t.createdAt.toLocaleTimeString('id-ID'),
          doctor: t.doctor?.name || '-',
          shift: t.shift.name,
          actions: actionsList,
          total: `Rp ${t.totalAmount.toLocaleString('id-ID')}`,
        })
      })

      // Add summary row
      worksheet.addRow({})
      worksheet.addRow({
        time: 'TOTAL',
        doctor: `${transactions.length} Transaksi`,
        shift: '',
        actions: '',
        total: `Rp ${transactions.reduce((sum, t) => sum + t.totalAmount, 0).toLocaleString('id-ID')}`,
      })

      // Add attendance section
      worksheet.addRow({})
      worksheet.addRow({})
      worksheet.addRow({ time: 'KEHADIRAN DOKTER' })
      
      attendances.forEach(a => {
        worksheet.addRow({
          time: a.attendanceTime,
          doctor: a.doctor?.name || a.manualDoctorName,
          shift: a.shift.name,
          actions: 'Hadir',
          total: '-',
        })
      })

      worksheet.getRow(1).font = { bold: true }
      
      const buffer = await workbook.xlsx.writeBuffer()
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="laporan-harian-${date}.xlsx"`,
        },
      })
    } else if (startDate && endDate) {
      // Export monthly/range report
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

      const workbook = new Workbook()
      const worksheet = workbook.addWorksheet(`Laporan ${startDate} - ${endDate}`)

      worksheet.columns = [
        { header: 'Tanggal', key: 'date' },
        { header: 'Dokter', key: 'doctor' },
        { header: 'Shift', key: 'shift' },
        { header: 'Tindakan', key: 'actions' },
        { header: 'Total', key: 'total' },
      ]

      transactions.forEach(t => {
        const actionsList = t.transactionDetails
          .map(td => `${td.medicalAction.name} x${td.quantity}`)
          .join(', ')
        
        worksheet.addRow({
          date: t.transactionDate,
          doctor: t.doctor?.name || '-',
          shift: t.shift.name,
          actions: actionsList,
          total: `Rp ${t.totalAmount.toLocaleString('id-ID')}`,
        })
      })

      worksheet.getRow(1).font = { bold: true }
      
      const buffer = await workbook.xlsx.writeBuffer()
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="laporan-${startDate}-${endDate}.xlsx"`,
        },
      })
    } else {
      return NextResponse.json(
        { error: 'Parameter date atau startDate+endDate diperlukan' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Export reports error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
