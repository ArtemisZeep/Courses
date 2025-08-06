import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

interface RouteContext {
  params: { id: string }
}

// Удалить вопрос
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    // Проверяем, существует ли вопрос
    const existingQuestion = await db.question.findUnique({
      where: { id: params.id },
    })

    if (!existingQuestion) {
      return NextResponse.json({ error: 'Вопрос не найден' }, { status: 404 })
    }

    // Удаляем вопрос (варианты ответов удалятся каскадно)
    await db.question.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Вопрос успешно удален' })
  } catch (error) {
    console.error('Ошибка при удалении вопроса:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 