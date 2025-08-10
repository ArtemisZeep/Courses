import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { LessonSchema } from '@/lib/schemas'
import { writeCurrentBackup } from '@/lib/backup'

// Получить все уроки модуля
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

    const lessons = await db.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ lessons })
  } catch (error) {
    console.error('Ошибка при получении уроков:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Создать новый урок
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
    const validatedFields = LessonSchema.safeParse(body)
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Неверные данные', details: validatedFields.error.issues },
        { status: 400 }
      )
    }

    const { title, contentHtml, googleDocUrl, order, moduleId } = validatedFields.data

    // Проверяем, что указан хотя бы один тип контента
    if (!contentHtml && !googleDocUrl) {
      return NextResponse.json(
        { error: 'Необходимо указать либо HTML контент, либо ссылку на Google Doc' },
        { status: 400 }
      )
    }

    // Проверяем, не занят ли порядковый номер
    const existingLesson = await db.lesson.findFirst({
      where: { moduleId, order },
    })

    if (existingLesson) {
      return NextResponse.json(
        { error: 'Урок с таким порядковым номером уже существует' },
        { status: 400 }
      )
    }

    const lesson = await db.lesson.create({
      data: {
        title,
        contentHtml: contentHtml || null,
        googleDocUrl: googleDocUrl || null,
        order,
        moduleId,
      },
    })

    writeCurrentBackup().catch(() => {})
    return NextResponse.json(
      { message: 'Урок успешно создан', lesson },
      { status: 201 }
    )
  } catch (error) {
    console.error('Ошибка при создании урока:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 