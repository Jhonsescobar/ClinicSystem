# Bug Fix - Attendance Photo Upload Error

---

## Bug: Unexpected token 'S', "Server act"... is not valid JSON

### Masalah:
Saat mengambil foto dan menyimpan data absen dokter, muncul error:
```
Unexpected token 'S', "Server act"... is not valid JSON
```

### Penyebab Utama:
**File `/api/upload/route.ts` TIDAK ADA!**

Ketika frontend mencoba upload foto ke `/api/upload`, server me-return:
- HTTP 404 (Not Found)
- HTML error page bukan JSON
- Frontend mencoba parse response sebagai JSON
- → Error: "Unexpected token 'S', 'Server act'..."

### Root Cause:
Saat development awal, file upload API dibuat tapi:
1. File tersebut tidak tersimpan dengan benar
2. Folder `/src/app/api/upload/` tidak dibuat
3. Hasilnya: Endpoint `/api/upload` tidak ada

### Flow Error:

```
┌─────────────────┐
│ Frontend        │
│ Attendance Page│
└────────┬────────┘
         │
         │ Take photo (base64)
         │
         ▼
┌─────────────────┐
│ Convert to Blob│
│ Create FormData│
└────────┬────────┘
         │
         │ POST /api/upload
         │
         ▼
┌─────────────────┐
│ Server          │
│ 404 Not Found  │← BUG: File tidak ada!
└────────┬────────┘
         │
         │ Return HTML error:
         │ "<!DOCTYPE html>...
         │  <title>Server act..."
         │
         ▼
┌─────────────────┐
│ Frontend        │
│ .json()        │← ERROR: Bukan JSON!
└────────┬────────┘
         │
         │ Parse Error:
         │ "Unexpected token 'S',
         │  'Server act'..."
         │
         ▼
┌─────────────────┐
│ Alert Error     │
└─────────────────┘
```

### Solusi:

#### 1. Buat Upload API Route
**File:** `/home/z/my-project/src/app/api/upload/route.ts`

```typescript
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
    const type = formData.get('type') as string

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
```

#### 2. Buat Upload Folders
```bash
mkdir -p /home/z/my-project/uploads/attendance
mkdir -p /home/z/my-project/uploads/transaction
```

#### 3. Perbaiki Error Handling di Frontend
**File:** `/home/z/my-project/src/app/attendance/page.tsx`

**SEBELUM (SALAH):**
```typescript
const uploadRes = await fetch('/api/upload', {
  method: 'POST',
  body: (() => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'attendance')
    return formData
  })(),
})

const uploadData = await uploadRes.json()  // ❌ Bisa crash jika bukan JSON

if (!uploadRes.ok) {
  throw new Error(uploadData.error || 'Upload failed')
}
```

**SESUDAH (BENAR):**
```typescript
const uploadFormData = new FormData()
uploadFormData.append('file', file)
uploadFormData.append('type', 'attendance')

const uploadRes = await fetch('/api/upload', {
  method: 'POST',
  body: uploadFormData,
})

if (!uploadRes.ok) {
  const errorText = await uploadRes.text()  // ✅ Ambil text dulu
  throw new Error(errorText || 'Upload failed')
}

const uploadData = await uploadRes.json()  // ✅ Baru parse JSON
```

### Flow Setelah Fix:

```
┌─────────────────┐
│ Frontend        │
│ Attendance Page│
└────────┬────────┘
         │
         │ Take photo (base64)
         │
         ▼
┌─────────────────┐
│ Convert to Blob│
│ Create FormData│
└────────┬────────┘
         │
         │ POST /api/upload
         │
         ▼
┌─────────────────┐
│ Server          │
│ /api/upload    │← ✅ File ADA!
└────────┬────────┘
         │
         │ Validate file
         │ Save to disk
         │
         ▼
┌─────────────────┐
│ Return JSON:    │
│ {              │
│   fileUrl: "/  │
│    uploads/...",│
│   filename: "..."│
│ }              │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Frontend        │
│ Parse JSON ✅  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save Attendance │
│ + Audit Log     │
└─────────────────┘
```

### Files yang Diperbaiki/Dibuat:

1. **DIBUAT:** `/home/z/my-project/src/app/api/upload/route.ts`
   - Handle file upload
   - Validate file type & size
   - Save to disk with unique filename
   - Return file URL

2. **DIBUAT:** Folders
   - `/home/z/my-project/uploads/attendance/`
   - `/home/z/my-project/uploads/transaction/`

3. **DIPERBAIKI:** `/home/z/my-project/src/app/attendance/page.tsx`
   - Line 81-100: Perbaiki error handling
   - Cek response.ok sebelum parse JSON
   - Gunakan .text() untuk error response

### Test Steps:

1. Login ke aplikasi
2. Pergi ke menu **Kehadiran**
3. Pilih Shift
4. Pilih Dokter
5. Klik tombol kamera untuk ambil foto
6. Ambil foto dan konfirmasi
7. Klik **Catat Kehadiran**
8. ✅ Harus berhasil tanpa error!

### Validasi yang Dilakukan:

**File Type:**
```typescript
if (!file.type.startsWith('image/')) {
  return NextResponse.json(
    { error: 'Hanya file gambar yang diperbolehkan' },
    { status: 400 }
  )
}
```

**File Size:**
```typescript
if (file.size > 5 * 1024 * 1024) {  // Max 5MB
  return NextResponse.json(
    { error: 'Ukuran file maksimal 5MB' },
    { status: 400 }
  )
}
```

**Authentication:**
```typescript
const user = await requireAuth()  // User harus login
```

### Output Format:

**Success Response:**
```json
{
  "fileUrl": "/uploads/attendance/abc123-def456.jpg",
  "filename": "abc123-def456.jpg"
}
```

**Error Response:**
```json
{
  "error": "Hanya file gambar yang diperbolehkan"
}
```

---

**Status:** ✅ BUG DIPERBAIKI

**Root Cause:** File upload API tidak dibuat saat development awal

**Solution:** Buat file `/api/upload/route.ts` dan perbaiki error handling di frontend

**Last Updated:** 2025-01-15
