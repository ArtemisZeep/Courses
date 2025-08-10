import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// Удалить вопрос
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const { id } = await params

    // Проверяем, существует ли вопрос
    const existingQuestion = await db.question.findUnique({
      where: { id },
    })

    if (!existingQuestion) {
      return NextResponse.json({ error: 'Вопрос не найден' }, { status: 404 })
    }

    // Удаляем вопрос (варианты ответов удалятся каскадно)
    await db.question.delete({
      where: { id },
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