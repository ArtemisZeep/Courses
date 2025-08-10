import { NextResponse } from 'next/server'
import { writeCurrentBackup } from '@/lib/backup'

export async function POST() {
  try {
    console.log('Starting backup creation...')
    const path = await writeCurrentBackup()
    console.log('Backup created successfully at:', path)
    return NextResponse.json({ ok: true, path })
  } catch (e) {
    console.error('Ошибка при создании текущего бэкапа:', e)
    return NextResponse.json({ error: 'Ошибка бэкапа', details: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function GET() {
  // Возможность триггера через GET (например, curl)
  return POST()
}


