import { db } from '@/lib/db'
import fs from 'fs/promises'
import path from 'path'

export interface BackupPayload {
  createdAt: string
  users: any[]
  modules: any[]
  lessons: any[]
  questions: any[]
  answerOptions: any[]
  assignments: any[]
  submissions: any[]
  quizResults: any[]
  progressFiles: Record<string, any>
}

const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups')
const CURRENT_PATH = path.join(BACKUP_DIR, 'current.json')

async function ensureDir(dir: string) {
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

export async function collectBackupPayload(): Promise<BackupPayload> {
  const [users, modules, lessons, questions, answerOptions, assignments, submissions, quizResults] = await Promise.all([
    db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        rating: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    db.module.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        isActive: true,
        attachmentUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.lesson.findMany({
      orderBy: [{ moduleId: 'asc' }, { order: 'asc' }],
      select: {
        id: true,
        moduleId: true,
        title: true,
        order: true,
        googleDocUrl: true,
        contentHtml: true,
      },
    }),
    db.question.findMany({
      orderBy: [{ moduleId: 'asc' }, { order: 'asc' }],
      select: { id: true, moduleId: true, title: true, description: true, type: true, order: true },
    }),
    db.answerOption.findMany({
      orderBy: [{ questionId: 'asc' }, { order: 'asc' }],
      select: { id: true, questionId: true, text: true, order: true, isCorrect: true },
    }),
    db.assignment.findMany({
      orderBy: [{ moduleId: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, moduleId: true, title: true, description: true, createdAt: true },
    }),
    db.submission.findMany({
      orderBy: { submittedAt: 'asc' },
      select: {
        id: true,
        userId: true,
        moduleId: true,
        assignmentId: true,
        fileUrl: true,
        status: true,
        grade: true,
        feedback: true,
        submittedAt: true,
        gradedAt: true,
      },
    }),
    db.quizResult.findMany({
      orderBy: { submittedAt: 'asc' },
      select: { id: true, userId: true, moduleId: true, scorePercent: true, attemptId: true, submittedAt: true },
    }),
  ])

  // Читаем прогресс-файлы из data/progress
  const progressDir = path.join(process.cwd(), 'data', 'progress')
  const progressFiles: Record<string, any> = {}
  try {
    const files = await fs.readdir(progressDir)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      try {
        const content = await fs.readFile(path.join(progressDir, file), 'utf-8')
        progressFiles[file] = JSON.parse(content)
      } catch {
        // игнорируем битые файлы
      }
    }
  } catch {
    // каталога может не быть — это нормально
  }

  return {
    createdAt: new Date().toISOString(),
    users,
    modules,
    lessons,
    questions,
    answerOptions,
    assignments,
    submissions,
    quizResults,
    progressFiles,
  }
}

export async function writeCurrentBackup(): Promise<string> {
  const payload = await collectBackupPayload()
  await ensureDir(BACKUP_DIR)
  await fs.writeFile(CURRENT_PATH, JSON.stringify(payload, null, 2), 'utf-8')
  return CURRENT_PATH
}

export async function writeSnapshotBackup(): Promise<string> {
  const payload = await collectBackupPayload()
  await ensureDir(BACKUP_DIR)
  const filename = `snapshot_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  const snapshotPath = path.join(BACKUP_DIR, filename)
  await fs.writeFile(snapshotPath, JSON.stringify(payload, null, 2), 'utf-8')
  // параллельно обновим current
  await fs.writeFile(CURRENT_PATH, JSON.stringify(payload, null, 2), 'utf-8')
  // чистка старых файлов
  await cleanupOldSnapshots(30).catch(() => {})
  return snapshotPath
}

export async function cleanupOldSnapshots(maxAgeDays: number = 30): Promise<number> {
  await ensureDir(BACKUP_DIR)
  const entries = await fs.readdir(BACKUP_DIR)
  const now = Date.now()
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000
  let removed = 0
  for (const name of entries) {
    if (!name.startsWith('snapshot_') || !name.endsWith('.json')) continue
    const p = path.join(BACKUP_DIR, name)
    try {
      const stat = await fs.stat(p)
      if (now - stat.mtimeMs > maxAgeMs) {
        await fs.unlink(p)
        removed++
      }
    } catch {
      // ignore
    }
  }
  return removed
}


