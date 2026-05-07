import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET all shifts
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const shifts = await db.shift.findMany({
      orderBy: { id: 'asc' },
    })

    return NextResponse.json({ shifts })
  } catch (error: any) {
    console.error('Get shifts error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// POST create shift (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth('SUPER_ADMIN')

    const body = await request.json()
    const { name, startTime, endTime, description } = body

    if (!name || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Nama, waktu mulai, dan waktu selesai diperlukan' },
        { status: 400 }
      )
    }

    const shift = await db.shift.create({
      data: {
        name,
        startTime,
        endTime,
        description,
      },
    })

    return NextResponse.json({ shift }, { status: 201 })
  } catch (error: any) {
    console.error('Create shift error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500 }
    )
  }
}
