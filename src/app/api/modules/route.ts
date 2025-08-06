import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ModuleSchema } from '@/lib/schemas'

// Получить все модули
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const modules = await db.module.findMany({
      where: {
        // Для админов показываем все модули, для студентов только активные
        ...(session.user.isAdmin ? {} : { isActive: true }),
      },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            type: true,
            order: true,
            isFinal: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            questions: true,
          },
        },
      },
      orderBy: { order: 'asc' },
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

// Создать новый модуль (только для админов)
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
    const validatedFields = ModuleSchema.safeParse(body)
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Неверные данные', details: validatedFields.error.issues },
        { status: 400 }
      )
    }

    const { title, description, order } = validatedFields.data

    // Проверяем, не занят ли порядковый номер (только среди активных модулей)
    const existingModule = await db.module.findFirst({
      where: { 
        order,
        isActive: true,
      },
    })

    if (existingModule) {
      return NextResponse.json(
        { error: 'Модуль с таким порядковым номером уже существует' },
        { status: 400 }
      )
    }

    const module = await db.module.create({
      data: {
        title,
        description,
        order,
      },
    })

    return NextResponse.json(
      { message: 'Модуль успешно создан', module },
      { status: 201 }
    )
  } catch (error) {
    console.error('Ошибка при создании модуля:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}