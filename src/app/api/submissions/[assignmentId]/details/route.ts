import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

interface RouteContext {
  params: Promise<{ assignmentId: string }>
}

// Получить детали решения студента с оценкой
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const { assignmentId } = await params

    const submission = await db.submission.findFirst({
      where: {
        userId: session.user.id,
        assignmentId: assignmentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignment: {
          include: {
            module: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Ошибка при получении деталей решения:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 