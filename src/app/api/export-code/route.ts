import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Return information about how to get the source code
    const exportInfo = {
      projectName: 'sistem-manajemen-klinik',
      exportDate: new Date().toISOString(),
      description: 'Sistem Manajemen Klinik Internal',
      message: 'Gunakan fitur download di sudut atas preview panel untuk mengunduh seluruh source code',
      instructions: [
        'Klik tombol download di sudut atas jendela preview',
        'Ekstrak file zip yang diunduh',
        'Ikuti panduan instalasi di README atau chat sebelumnya',
      ],
      techStack: {
        framework: 'Next.js 16',
        language: 'TypeScript 5',
        styling: 'Tailwind CSS 4 + shadcn/ui',
        database: 'Prisma ORM + SQLite',
        auth: 'JWT',
      },
    }

    return NextResponse.json(exportInfo)
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Gagal mengekspor kode', details: error.message },
      { status: 500 }
    )
  }
}
