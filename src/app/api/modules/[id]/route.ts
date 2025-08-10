import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ModuleSchema } from '@/lib/schemas'

// Получить конкретный модуль
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const { id } = await params

    const module = await db.module.findUnique({
      where: {
        id,
        isActive: true,
      },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                text: true,
                order: true,
                // isCorrect скрываем от студентов
                ...(session.user.isAdmin && { isCorrect: true }),
              },
            },
          },
        },
        assignments: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            lessons: true,
            questions: true,
          },
        },
      },
    })

    if (!module) {
      return NextResponse.json({ error: 'Модуль не найден' }, { status: 404 })
    }

    return NextResponse.json({ module })
  } catch (error) {
    console.error('Ошибка при получении модуля:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Обновить модуль (только для админов)
export async function PUT(
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
    const body = await request.json()
    
    // Валидация входных данных
    const validatedFields = ModuleSchema.safeParse(body)
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Неверные данные', details: validatedFields.error.issues },
        { status: 400 }
      )
    }

    const { title, description, order, isActive } = validatedFields.data

    // Проверяем, существует ли модуль
    const existingModule = await db.module.findUnique({
      where: { id },
    })

    if (!existingModule) {
      return NextResponse.json({ error: 'Модуль не найден' }, { status: 404 })
    }

    // Проверяем, не занят ли порядковый номер другим модулем
    if (order !== existingModule.order) {
      const conflictModule = await db.module.findUnique({
        where: { order },
      })

      if (conflictModule) {
        return NextResponse.json(
          { error: 'Модуль с таким порядковым номером уже существует' },
          { status: 400 }
        )
      }
    }

    const module = await db.module.update({
      where: { id },
      data: {
        title,
        description,
        order,
        isActive,
      },
    })

    return NextResponse.json({ message: 'Модуль успешно обновлен', module })
  } catch (error) {
    console.error('Ошибка при обновлении модуля:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Удалить модуль (только для админов)
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

    // Проверяем, существует ли модуль
    const existingModule = await db.module.findUnique({
      where: { id },
    })

    if (!existingModule) {
      return NextResponse.json({ error: 'Модуль не найден' }, { status: 404 })
    }

    // Физическое удаление модуля
    await db.module.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Модуль успешно удален' })
  } catch (error) {
    console.error('Ошибка при удалении модуля:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}