import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, clearAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (user) {
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGOUT',
          tableName: 'users',
          recordId: user.id,
          dataBefore: JSON.stringify({ email: user.email, role: user.role }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })
    }

    await clearAuthCookie()

    return NextResponse.json({ message: 'Logout berhasil' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat logout' },
      { status: 500 }
    )
  }
}
