import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

interface QuestionData {
  title: string
  description?: string
  type: 'single' | 'multiple'
  order: number
  options: {
    text: string
    isCorrect: boolean
    order: number
  }[]
}

interface BulkQuestionsRequest {
  moduleId: string
  questions: QuestionData[]
}

// Массовая загрузка вопросов
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const body: BulkQuestionsRequest = await request.json()
    const { moduleId, questions } = body

    if (!moduleId) {
      return NextResponse.json({ error: 'ID модуля обязателен' }, { status: 400 })
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Список вопросов обязателен' }, { status: 400 })
    }

    // Проверяем, существует ли модуль
    const module = await db.module.findUnique({
      where: { id: moduleId }
    })

    if (!module) {
      return NextResponse.json({ error: 'Модуль не найден' }, { status: 404 })
    }

    const createdQuestions = []

    for (const questionData of questions) {
      // Валидация вопроса
      if (!questionData.title || !questionData.type || !questionData.options || questionData.options.length === 0) {
        return NextResponse.json({ 
          error: 'Неверный формат вопроса', 
          details: 'Каждый вопрос должен содержать title, type и options' 
        }, { status: 400 })
      }

      if (questionData.type !== 'single' && questionData.type !== 'multiple') {
        return NextResponse.json({ 
          error: 'Неверный тип вопроса', 
          details: 'Тип должен быть "single" или "multiple"' 
        }, { status: 400 })
      }

      // Проверяем, что есть хотя бы один правильный ответ
      const correctOptions = questionData.options.filter(opt => opt.isCorrect)
      if (correctOptions.length === 0) {
        return NextResponse.json({ 
          error: 'Должен быть хотя бы один правильный ответ', 
          details: `Вопрос "${questionData.title}" не имеет правильных ответов` 
        }, { status: 400 })
      }

      // Создаем вопрос
      const question = await db.question.create({
        data: {
          title: questionData.title,
          description: questionData.description || null,
          type: questionData.type,
          order: questionData.order,
          moduleId: moduleId,
          isFinal: true,
        }
      })

      // Создаем варианты ответов
      for (const optionData of questionData.options) {
        await db.answerOption.create({
          data: {
            text: optionData.text,
            isCorrect: optionData.isCorrect,
            order: optionData.order,
            questionId: question.id,
          }
        })
      }

      createdQuestions.push({
        id: question.id,
        title: question.title,
        type: question.type,
        optionsCount: questionData.options.length
      })
    }

    return NextResponse.json({
      message: `Успешно создано ${createdQuestions.length} вопросов`,
      questions: createdQuestions
    }, { status: 201 })

  } catch (error) {
    console.error('Ошибка при массовой загрузке вопросов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 