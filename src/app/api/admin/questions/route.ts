import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeCurrentBackup } from '@/lib/backup'

// Получить вопросы для модуля
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
    const moduleId = searchParams.get('moduleId')

    if (!moduleId) {
      return NextResponse.json({ error: 'Не указан ID модуля' }, { status: 400 })
    }

    const questions = await db.question.findMany({
      where: { moduleId },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Ошибка при получении вопросов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Создать новый вопрос
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
    const { title, description, type, order, isFinal, moduleId, options } = body

    if (!title || !type || !order || !moduleId || !options) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      )
    }

    if (options.length < 2) {
      return NextResponse.json(
        { error: 'Добавьте минимум 2 варианта ответа' },
        { status: 400 }
      )
    }

    if (!options.some((opt: any) => opt.isCorrect)) {
      return NextResponse.json(
        { error: 'Выберите хотя бы один правильный ответ' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли модуль
    const existingModule = await db.module.findUnique({
      where: { id: moduleId },
    })

    if (!existingModule) {
      return NextResponse.json(
        { error: 'Модуль не найден' },
        { status: 404 }
      )
    }

    // Проверяем, не занят ли порядковый номер
    const existingQuestion = await db.question.findFirst({
      where: { moduleId, order },
    })

    if (existingQuestion) {
      return NextResponse.json(
        { error: 'Вопрос с таким порядковым номером уже существует' },
        { status: 400 }
      )
    }

    // Создаем вопрос с вариантами ответов
    const question = await db.question.create({
      data: {
        title,
        description,
        type,
        order,
        isFinal,
        moduleId,
        options: {
          create: options.map((opt: any, index: number) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: index + 1,
          })),
        },
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    })

    // Бэкапим текущее состояние
    writeCurrentBackup().catch(() => {})
    return NextResponse.json(
      { message: 'Вопрос успешно создан', question },
      { status: 201 }
    )
  } catch (error) {
    console.error('Ошибка при создании вопроса:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 