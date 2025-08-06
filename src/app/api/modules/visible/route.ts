import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOrCreateProgress } from '@/lib/progress-store'

// Получить модули с учетом прогресса студента
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    // Получаем все активные модули
    const modules = await db.module.findMany({
      where: {
        isActive: true,
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
          include: {
            options: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                text: true,
                order: true,
                // Не включаем isCorrect для безопасности
              },
            },
          },
        },
        assignments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            questions: true,
            assignments: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    })

    const moduleIds = modules.map(m => m.id)
    
    // Получаем прогресс студента
    const progress = await getOrCreateProgress(session.user.id, moduleIds)

    // Получаем информацию о submission'ах пользователя
    const submissions = await db.submission.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        assignmentId: true,
        status: true,
        grade: true,
        assignment: {
          select: {
            moduleId: true,
          },
        },
      },
    })

    // Объединяем данные модулей с прогрессом
    const modulesWithProgress = modules.map(module => {
      const moduleProgress = progress.modules.find(m => m.moduleId === module.id)
      
      // Подсчитываем задания для этого модуля
      const moduleSubmissions = submissions.filter(s => s.assignment.moduleId === module.id)
      const assignmentsInfo = {
        total: module.assignments.length,
        completed: moduleSubmissions.length,
        details: moduleSubmissions.map(s => ({
          id: s.assignmentId,
          submitted: true,
          grade: s.grade,
        })),
      }
      
      return {
        ...module,
        progress: {
          ...(moduleProgress || {
            moduleId: module.id,
            status: 'available', // Все модули доступны по умолчанию
            lessonsRead: [],
            quiz: {
              attempts: [],
              bestScorePercent: undefined,
              passedAt: undefined,
            },
            assignment: {
              submitted: false,
            },
          }),
          assignments: assignmentsInfo,
        },
      }
    })

    // Показываем все модули (все доступны)
    const visibleModules = modulesWithProgress

    return NextResponse.json({ modules: visibleModules, allModules: modulesWithProgress })
  } catch (error) {
    console.error('Ошибка при получении видимых модулей:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}