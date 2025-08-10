import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { GradeSubmissionSchema } from '@/lib/schemas'
import { writeCurrentBackup } from '@/lib/backup'

// Оценить отправленное задание
export async function POST(
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

    const body = await request.json()
    const validatedFields = GradeSubmissionSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Неверные данные', details: validatedFields.error.issues },
        { status: 400 }
      )
    }

    const { grade, feedback } = validatedFields.data

    const { id } = await params

    // Проверяем, существует ли задание
    const existingSubmission = await db.submission.findUnique({
      where: { id },
      select: { userId: true, grade: true, status: true }
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

    // Начисляем баллы за рейтинг за задание с учетом возможного переоценивания
    // 5 -> 100, 4 -> 80, 3 -> 60, 2 -> 40, 1 -> 20, 0 -> 0
    const newPoints = grade * 20
    const previousPoints = (existingSubmission.grade ?? 0) * 20
    const delta = newPoints - previousPoints
    if (delta !== 0) {
      await db.user.update({
        where: { id: submission.userId },
        data: {
          rating: {
            increment: delta,
          },
        },
      })
    }

    // Асинхронно обновляем текущий бэкап
    writeCurrentBackup().catch(() => {})

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