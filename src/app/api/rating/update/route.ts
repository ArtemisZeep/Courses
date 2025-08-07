import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, points } = await request.json()

    if (!userId || typeof points !== 'number') {
      return NextResponse.json(
        { error: 'Неверные параметры' },
        { status: 400 }
      )
    }

    // Обновляем рейтинг пользователя
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        rating: {
          increment: points
        }
      },
      select: {
        id: true,
        name: true,
        rating: true
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Ошибка при обновлении рейтинга:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении рейтинга' },
      { status: 500 }
    )
  }
}
