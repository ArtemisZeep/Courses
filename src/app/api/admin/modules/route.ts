import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Получить все модули для админ панели (включая неактивные)
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const modules = await db.module.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            lessons: true,
            questions: true,
          },
        },
      },
    })

    return NextResponse.json({ modules })
  } catch (error) {
    console.error('Ошибка при получении модулей:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 