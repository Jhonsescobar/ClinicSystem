import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile, stat } from 'fs/promises'
import { join, relative } from 'path'

const IGNORED_FILES = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  '.env',
  '.env.local',
  '.env.production',
  'coverage',
  '.DS_Store',
  '*.log',
  'uploads',
  'db',
]

const IGNORED_EXTENSIONS = ['.sqlite', '.sqlite-journal', '.lock']

function shouldIgnoreFile(filePath: string, isDir: boolean): boolean {
  const basename = filePath.split('/').pop() || ''

  // Check ignored directories
  if (isDir && IGNORED_FILES.includes(basename)) {
    return true
  }

  // Check ignored files
  if (!isDir) {
    // Check exact matches
    if (IGNORED_FILES.includes(basename)) {
      return true
    }

    // Check extensions
    for (const ext of IGNORED_EXTENSIONS) {
      if (basename.endsWith(ext)) {
        return true
      }
    }
  }

  // Skip hidden files (except some config files)
  if (basename.startsWith('.') && !['.gitignore', '.eslintrc', '.prettierrc', '.env.example'].includes(basename)) {
    return true
  }

  return false
}

async function getDirectoryTree(dirPath: string, basePath: string): Promise<any> {
  const items = await readdir(dirPath)
  const tree: any = {}

  for (const item of items) {
    const fullPath = join(dirPath, item)
    const relativePath = relative(basePath, fullPath)
    const stats = await stat(fullPath)
    const isDir = stats.isDirectory()

    if (shouldIgnoreFile(relativePath, isDir)) {
      continue
    }

    if (isDir) {
      tree[item] = await getDirectoryTree(fullPath, basePath)
    } else {
      try {
        const content = await readFile(fullPath, 'utf-8')
        tree[item] = content
      } catch (error) {
        tree[item] = `Error reading file: ${error}`
      }
    }
  }

  return tree
}

export async function GET(request: NextRequest) {
  try {
    const projectRoot = process.cwd()

    // Get project structure and file contents
    const projectFiles = await getDirectoryTree(projectRoot, projectRoot)

    // Create JSON response
    const exportData = {
      projectName: 'sistem-manajemen-klinik',
      exportDate: new Date().toISOString(),
      description: 'Sistem Manajemen Klinik Internal - Full Source Code Export',
      files: projectFiles,
    }

    return NextResponse.json(exportData)
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Gagal mengekspor kode', details: error.message },
      { status: 500 }
    )
  }
}
