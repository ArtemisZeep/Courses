import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Получить все отправленные задания
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const submissions = await db.submission.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        module: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Ошибка при получении заданий:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 