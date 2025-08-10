import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10

    // Получаем всех пользователей с их рейтингом
    const users = await db.user.findMany({
      where: {
        isAdmin: false // Только студенты
      },
      select: {
        id: true,
        name: true,
        email: true,
        rating: true,
        createdAt: true
      },
      orderBy: {
        rating: 'desc'
      },
      take: limit
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Ошибка при получении рейтинга:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении рейтинга' },
      { status: 500 }
    )
  }
}
