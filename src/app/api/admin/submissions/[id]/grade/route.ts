import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Оценить отправленное задание
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { grade, feedback } = body

    if (grade === undefined || (grade !== 'PASSED' && grade !== 'FAILED')) {
      return NextResponse.json(
        { error: 'Оценка должна быть "PASSED" или "FAILED"' },
        { status: 400 }
      )
    }

    const { id } = await params

    // Проверяем, существует ли задание
    const existingSubmission = await db.submission.findUnique({
      where: { id },
    })

    if (!existingSubmission) {
      return NextResponse.json({ error: 'Задание не найдено' }, { status: 404 })
    }

    // Обновляем задание
    const submission = await db.submission.update({
      where: { id },
      data: {
        grade,
        feedback,
        status: 'GRADED', // Используем правильное значение из enum
        gradedAt: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        module: {
          select: {
            title: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Оценка успешно сохранена',
      submission,
    })
  } catch (error) {
    console.error('Ошибка при оценке задания:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 