import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { requireAuth } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'attendance' or 'transaction'

    if (!file) {
      return NextResponse.json(
        { error: 'File diperlukan' },
        { status: 400 }
      )
    }

    if (!type || !['attendance', 'transaction'].includes(type)) {
      return NextResponse.json(
        { error: 'Type harus attendance atau transaction' },
        { status: 400 }
      )
    }

    // Validate file type (only images)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Hanya file gambar yang diperbolehkan' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Ukuran file maksimal 5MB' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const ext = path.extname(file.name)
    const filename = `${uuidv4()}${ext}`

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'uploads', type)
    await mkdir(uploadDir, { recursive: true })

    // Write file
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const fileUrl = `/uploads/${type}/${filename}`

    return NextResponse.json({
      fileUrl,
      filename,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat upload' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
