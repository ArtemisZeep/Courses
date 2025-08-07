import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Необходимы права администратора' }, { status: 403 })
    }

    // Получаем все данные для отладки
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
      },
    })

    const quizResults = await db.quizResult.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    const submissions = await db.submission.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        assignment: {
          select: {
            id: true,
            title: true,
            moduleId: true,
          },
        },
      },
    })

    const modules = await db.module.findMany({
      select: {
        id: true,
        title: true,
        order: true,
      },
    })

    return NextResponse.json({
      users,
      quizResults,
      submissions,
      modules,
      summary: {
        totalUsers: users.length,
        adminUsers: users.filter(u => u.isAdmin).length,
        studentUsers: users.filter(u => !u.isAdmin).length,
        totalQuizResults: quizResults.length,
        totalSubmissions: submissions.length,
        gradedSubmissions: submissions.filter(s => s.grade !== null).length,
      }
    })
  } catch (error) {
    console.error('Ошибка при отладке данных:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}