import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOrCreateProgress } from '@/lib/progress-store'

// Получить прогресс текущего пользователя
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    // Получаем все активные модули для инициализации прогресса
    const modules = await db.module.findMany({
      where: { isActive: true },
      select: { id: true },
      orderBy: { order: 'asc' },
    })

    const moduleIds = modules.map(m => m.id)
    
    // Получаем или создаем прогресс пользователя
    const progress = await getOrCreateProgress(session.user.id, moduleIds)

    return NextResponse.json({ progress })
  } catch (error) {
    console.error('Ошибка при получении прогресса:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}