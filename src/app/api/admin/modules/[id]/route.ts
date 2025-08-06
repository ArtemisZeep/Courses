import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Получить модуль по ID для админ панели (включая неактивные)
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const { id } = await params

    const module = await db.module.findUnique({
      where: { id },
      include: {
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
export async function PUT(request: NextRequest, { params }: RouteContext) {
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
    const { title, description, order, isActive } = body

    if (!title || !description || order === undefined || isActive === undefined) {
      return NextResponse.json(
        { error: 'Все поля обязательны' },
        { status: 400 }
      )
    }

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
      include: {
        _count: {
          select: {
            lessons: true,
            questions: true,
          },
        },
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
export async function DELETE(request: NextRequest, { params }: RouteContext) {
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