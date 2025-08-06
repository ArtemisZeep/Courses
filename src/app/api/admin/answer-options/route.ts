import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { AnswerOptionSchema } from '@/lib/schemas'

// Получить варианты ответов для вопроса
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('questionId')

    if (!questionId) {
      return NextResponse.json({ error: 'Не указан ID вопроса' }, { status: 400 })
    }

    const options = await db.answerOption.findMany({
      where: { questionId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ options })
  } catch (error) {
    console.error('Ошибка при получении вариантов ответов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Создать новый вариант ответа
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    
    // Валидация входных данных
    const validatedFields = AnswerOptionSchema.safeParse(body)
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Неверные данные', details: validatedFields.error.issues },
        { status: 400 }
      )
    }

    const { text, isCorrect, order, questionId } = validatedFields.data

    // Проверяем, не занят ли порядковый номер
    const existingOption = await db.answerOption.findFirst({
      where: { questionId, order },
    })

    if (existingOption) {
      return NextResponse.json(
        { error: 'Вариант ответа с таким порядковым номером уже существует' },
        { status: 400 }
      )
    }

    const option = await db.answerOption.create({
      data: {
        text,
        isCorrect,
        order,
        questionId,
      },
    })

    return NextResponse.json(
      { message: 'Вариант ответа успешно создан', option },
      { status: 201 }
    )
  } catch (error) {
    console.error('Ошибка при создании варианта ответа:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 