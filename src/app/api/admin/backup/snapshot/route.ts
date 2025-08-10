import { NextResponse } from 'next/server'
import { writeSnapshotBackup } from '@/lib/backup'

export async function POST() {
  try {
    console.log('Creating daily snapshot backup...')
    const path = await writeSnapshotBackup()
    console.log('Snapshot backup created successfully at:', path)
    return NextResponse.json({ ok: true, path })
  } catch (e) {
    console.error('Ошибка при создании снапшота:', e)
    return NextResponse.json({ error: 'Ошибка снапшота', details: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function GET() {
  // Возможность триггера через GET (например, curl)
  return POST()
}


