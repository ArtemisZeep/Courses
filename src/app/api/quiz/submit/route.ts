import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// Отправить результаты теста
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const body = await request.json()
    const { moduleId, answers } = body

    // Валидация входных данных
    if (!moduleId) {
      return NextResponse.json({ error: 'ID модуля обязателен' }, { status: 400 })
    }

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Ответы должны быть массивом' }, { status: 400 })
    }

    // Проверяем, что модуль существует
    const module = await db.module.findUnique({
      where: { id: moduleId },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!module) {
      return NextResponse.json({ error: 'Модуль не найден' }, { status: 404 })
    }

    // Проверяем, что пользователь существует
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Подсчитываем результаты
    let correctAnswers = 0
    let totalQuestions = module.questions.length

    for (const question of module.questions) {
      const userAnswer = answers.find((a: any) => a.questionId === question.id)
      
      if (userAnswer) {
        if (question.type === 'single') {
          // Для одиночного выбора
          const correctOption = question.options.find(opt => opt.isCorrect)
          if (correctOption && userAnswer.selectedOptionIds.includes(correctOption.id)) {
            correctAnswers++
          }
        } else if (question.type === 'multiple') {
          // Для множественного выбора
          const correctOptions = question.options.filter(opt => opt.isCorrect)
          const userSelectedOptions = userAnswer.selectedOptionIds
          
          if (correctOptions.length === userSelectedOptions.length &&
              correctOptions.every(opt => userSelectedOptions.includes(opt.id))) {
            correctAnswers++
          }
        }
      }
    }

    const scorePercent = Math.round((correctAnswers / totalQuestions) * 100)
    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log('Saving quiz result with answers:', answers)
    // Сохраняем результат
    const quizResult = await db.quizResult.create({
      data: {
        userId: session.user.id,
        moduleId: moduleId,
        scorePercent: scorePercent,
        attemptId: attemptId,
        answers: answers, // Добавляем детальные ответы в JSON
        submittedAt: new Date(),
      },
    })

    // Подготавливаем детальную информацию об ответах для показа результатов
    const detailedAnswers = module.questions.map(question => {
      const userAnswer = answers.find((a: any) => a.questionId === question.id)
      const userSelectedOptions = userAnswer?.selectedOptionIds || []
      const correctOptions = question.options.filter(opt => opt.isCorrect).map(opt => opt.id)
      
      let isCorrect = false
      if (question.type === 'single') {
        const correctOption = question.options.find(opt => opt.isCorrect)
        isCorrect = correctOption ? userSelectedOptions.includes(correctOption.id) : false
      } else if (question.type === 'multiple') {
        isCorrect = correctOptions.length === userSelectedOptions.length &&
                   correctOptions.every(opt => userSelectedOptions.includes(opt))
      }

      const answerDetail = {
        questionId: question.id,
        selectedOptionIds: userSelectedOptions,
        correctOptionIds: correctOptions,
        isCorrect: isCorrect
      }
      console.log(`Detailed answer for question ${question.id}:`, answerDetail)
      return answerDetail
    })

    return NextResponse.json({
      message: 'Тест успешно отправлен',
      result: {
        id: quizResult.id,
        scorePercent: scorePercent,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions,
        attemptId: attemptId,
        attempt: {
          answers: detailedAnswers
        }
      },
    })
  } catch (error) {
    console.error('Ошибка при отправке теста:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Получить последний результат теста для модуля
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('moduleId')

    if (!moduleId) {
      return NextResponse.json({ error: 'ID модуля обязателен' }, { status: 400 })
    }

    // Получаем последний результат теста для данного модуля и пользователя
    const lastResult = await db.quizResult.findFirst({
      where: {
        userId: session.user.id,
        moduleId: moduleId,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    })

    if (!lastResult) {
      return NextResponse.json({ result: null })
    }

    // Получаем модуль с вопросами для восстановления деталей ответов
    const module = await db.module.findUnique({
      where: { id: moduleId },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!module) {
      return NextResponse.json({ error: 'Модуль не найден' }, { status: 404 })
    }

    const totalQuestions = module.questions.length
    const correctAnswers = Math.round((lastResult.scorePercent / 100) * totalQuestions)

    // Восстанавливаем детальную информацию об ответах из JSON
    const storedAnswers = lastResult.answers as any[]
    console.log('Stored answers from DB:', storedAnswers)
    const detailedAnswers = module.questions.map(question => {
      const userAnswer = storedAnswers.find((a: any) => a.questionId === question.id)
      const userSelectedOptions = userAnswer?.selectedOptionIds || []
      const correctOptions = question.options.filter(opt => opt.isCorrect).map(opt => opt.id)
      
      let isCorrect = false
      if (question.type === 'single') {
        const correctOption = question.options.find(opt => opt.isCorrect)
        isCorrect = correctOption ? userSelectedOptions.includes(correctOption.id) : false
      } else if (question.type === 'multiple') {
        isCorrect = correctOptions.length === userSelectedOptions.length &&
                   correctOptions.every(opt => userSelectedOptions.includes(opt))
      }

      const answerDetail = {
        questionId: question.id,
        selectedOptionIds: userSelectedOptions,
        correctOptionIds: correctOptions,
        isCorrect: isCorrect
      }
      console.log(`Answer detail for question ${question.id}:`, answerDetail)
      return answerDetail
    })

    return NextResponse.json({
      result: {
        id: lastResult.id,
        scorePercent: lastResult.scorePercent,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions,
        attemptId: lastResult.attemptId,
        attempt: {
          answers: detailedAnswers
        }
      },
    })
  } catch (error) {
    console.error('Ошибка при получении результата теста:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 