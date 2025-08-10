import { NextResponse } from 'next/server'
import { cleanupOldSnapshots } from '@/lib/backup'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const days = body?.days || 30
    
    console.log(`Cleaning up snapshots older than ${days} days...`)
    const removed = await cleanupOldSnapshots(days)
    console.log(`Removed ${removed} old snapshot files`)
    
    return NextResponse.json({ ok: true, removed })
  } catch (e) {
    console.error('Ошибка при очистке старых снапшотов:', e)
    return NextResponse.json({ error: 'Ошибка очистки', details: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function GET() {
  // Возможность триггера через GET с дефолтными настройками (30 дней)
  const req = new Request('http://local', { 
    method: 'POST', 
    body: JSON.stringify({ days: 30 }) 
  })
  return POST(req)
}


