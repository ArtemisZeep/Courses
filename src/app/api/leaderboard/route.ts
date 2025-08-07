import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

interface UserScore {
  userId: string
  name: string
  email: string
  totalScore: number
  quizScore: number
  assignmentScore: number
  completedModules: number
  isAdmin: boolean
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    // Получаем всех пользователей
    const users = await db.user.findMany({
      // Временно включаем всех пользователей для тестирования
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
      },
    })

    // Получаем все результаты тестов
    const quizResults = await db.quizResult.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'asc',
      },
    })

    // Получаем все оценки за задания
    const submissions = await db.submission.findMany({
      where: {
        grade: {
          not: null,
        },
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
          select: {
            id: true,
            moduleId: true,
          },
        },
      },
    })

    // Подсчитываем баллы для каждого пользователя
    const userScores: Record<string, UserScore> = {}

    // Инициализируем всех пользователей
    users.forEach(user => {
      userScores[user.id] = {
        userId: user.id,
        name: user.name,
        email: user.email,
        totalScore: 0,
        quizScore: 0,
        assignmentScore: 0,
        completedModules: 0,
        isAdmin: user.isAdmin,
      }
    })

    // Подсчитываем баллы за тесты
    const userQuizAttempts: Record<string, Record<string, number>> = {}
    const userBestQuizScores: Record<string, Record<string, number>> = {}
    
    // Сначала определяем количество попыток и лучшие результаты по модулям
    quizResults.forEach(result => {
      const userId = result.userId
      const moduleId = result.moduleId
      
      if (!userQuizAttempts[userId]) {
        userQuizAttempts[userId] = {}
      }
      if (!userBestQuizScores[userId]) {
        userBestQuizScores[userId] = {}
      }
      if (!userQuizAttempts[userId][moduleId]) {
        userQuizAttempts[userId][moduleId] = 0
      }
      userQuizAttempts[userId][moduleId]++
      
      // Определяем, первая ли это попытка для этого модуля
      const isFirstAttempt = userQuizAttempts[userId][moduleId] === 1
      const coefficient = isFirstAttempt ? 1 : 0.7
      
      // Максимальный балл за тест - 100, умножаем на процент и коэффициент
      const quizPoints = Math.round(result.scorePercent * coefficient)
      
      // Берем лучший результат для модуля
      if (!userBestQuizScores[userId][moduleId] || userBestQuizScores[userId][moduleId] < quizPoints) {
        userBestQuizScores[userId][moduleId] = quizPoints
      }
    })
    
    // Суммируем баллы по всем модулям
    Object.keys(userBestQuizScores).forEach(userId => {
      if (userScores[userId]) {
        const totalQuizScore = Object.values(userBestQuizScores[userId]).reduce((sum, score) => sum + score, 0)
        userScores[userId].quizScore = totalQuizScore
      }
    })

    // Подсчитываем баллы за задания
    const userAssignmentScores: Record<string, number> = {}
    
    submissions.forEach(submission => {
      const userId = submission.userId
      const grade = submission.grade!
      
      if (userScores[userId]) {
        // Преобразуем оценку 0-5 в баллы 0-100
        const assignmentPoints = grade * 20
        
        if (!userAssignmentScores[userId]) {
          userAssignmentScores[userId] = 0
        }
        userAssignmentScores[userId] += assignmentPoints
        
        userScores[userId].assignmentScore = userAssignmentScores[userId]
      }
    })

    // Подсчитываем общий балл
    Object.values(userScores).forEach(userScore => {
      userScore.totalScore = userScore.quizScore + userScore.assignmentScore
    })

    // Отладочная информация
    console.log('=== LEADERBOARD DEBUG ===')
    console.log('Quiz results count:', quizResults.length)
    console.log('Submissions count:', submissions.length)
    console.log('User scores:', Object.values(userScores).map(u => ({
      name: u.name,
      isAdmin: u.isAdmin,
      quizScore: u.quizScore,
      assignmentScore: u.assignmentScore,
      totalScore: u.totalScore
    })))

    // Сортируем по общему баллу и берем топ-10
    const leaderboard = Object.values(userScores)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }))

    return NextResponse.json({
      leaderboard,
      totalUsers: leaderboard.length,
      debug: {
        quizResultsCount: quizResults.length,
        submissionsCount: submissions.length,
        allUserScores: Object.values(userScores).map(u => ({
          name: u.name,
          isAdmin: u.isAdmin,
          quizScore: u.quizScore,
          assignmentScore: u.assignmentScore,
          totalScore: u.totalScore
        }))
      }
    })
  } catch (error) {
    console.error('Ошибка при получении таблицы лидеров:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}