import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOrCreateProgress } from '@/lib/progress-store'
import { PASS_THRESHOLD_PERCENT } from '@/lib/constants'

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
    // Подтягиваем лучшие результаты тестов по модулям
    const quizResults = await db.quizResult.findMany({
      where: { userId: session.user.id },
      select: { moduleId: true, scorePercent: true },
      orderBy: { submittedAt: 'desc' }
    })

    const bestScoreByModule = new Map<string, number>()
    for (const r of quizResults) {
      const cur = bestScoreByModule.get(r.moduleId)
      if (cur === undefined || r.scorePercent > cur) {
        bestScoreByModule.set(r.moduleId, r.scorePercent)
      }
    }

    const modulesWithProgress = modules.map(module => {
      const moduleProgress = progress.modules.find(m => m.moduleId === module.id)
      
      // Подсчитываем задания для этого модуля
      const moduleSubmissions = submissions.filter(s => s.assignment && s.assignment.moduleId === module.id)
      const assignmentsInfo = {
        total: module.assignments.length,
        completed: moduleSubmissions.length,
        details: moduleSubmissions.map(s => ({
          id: s.assignmentId,
          submitted: true,
          grade: s.grade,
        })),
      }
      const bestScorePercent = bestScoreByModule.get(module.id)

      return {
        ...module,
        progress: {
          ...(moduleProgress || {
            moduleId: module.id,
            status: 'available', // Все модули доступны по умолчанию
            lessonsRead: [],
            quiz: {
              attempts: [],
              bestScorePercent: bestScorePercent,
              passedAt: undefined,
            },
            assignment: {
              submitted: false,
            },
          }),
          // Обновляем bestScore из БД, если есть
          quiz: {
            ...(moduleProgress?.quiz || { attempts: [] }),
            bestScorePercent,
            passedAt: moduleProgress?.quiz.passedAt,
          },
          assignments: assignmentsInfo,
        },
      }
    })

    // Пересчитываем статус доступности/прохождения модулей
    let previousPassed = false
    const visibleModules = modulesWithProgress
      .sort((a, b) => a.order - b.order)
      .map((m, idx) => {
        const bestScore = m.progress.quiz.bestScorePercent || 0
        const hasPassedQuiz = bestScore >= PASS_THRESHOLD_PERCENT
        const hasSubmittedAssignment = (m.progress.assignments?.completed || 0) > 0
        const thisPassed = hasPassedQuiz && hasSubmittedAssignment

        let status: 'locked' | 'available' | 'passed' = 'available'
        if (idx === 0) {
          status = thisPassed ? 'passed' : 'available'
        } else {
          status = previousPassed ? 'available' : 'locked'
          if (thisPassed) status = 'passed'
        }

        previousPassed = thisPassed

        return {
          ...m,
          progress: {
            ...m.progress,
            status,
          },
        }
      })

    return NextResponse.json({ modules: visibleModules, allModules: modulesWithProgress })
  } catch (error) {
    console.error('Ошибка при получении видимых модулей:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}