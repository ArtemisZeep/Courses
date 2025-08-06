import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { progressStore, getOrCreateProgress } from '@/lib/progress-store'
import { LessonReadSchema } from '@/lib/schemas'

// Отметить урок как прочитанный
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const body = await request.json()
    
    // Валидация входных данных
    const validatedFields = LessonReadSchema.safeParse(body)
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Неверные данные', details: validatedFields.error.issues },
        { status: 400 }
      )
    }

    const { moduleId, lessonId } = validatedFields.data

    // Проверяем, существует ли урок
    const lesson = await db.lesson.findFirst({
      where: {
        id: lessonId,
        moduleId: moduleId,
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 404 })
    }

    // Получаем все модули для инициализации прогресса
    const modules = await db.module.findMany({
      where: { isActive: true },
      select: { id: true },
      orderBy: { order: 'asc' },
    })

    const moduleIds = modules.map(m => m.id)
    
    // Получаем текущий прогресс
    const progress = await getOrCreateProgress(session.user.id, moduleIds)

    // Находим модуль в прогрессе
    const moduleProgress = progress.modules.find(m => m.moduleId === moduleId)
    if (!moduleProgress) {
      return NextResponse.json({ error: 'Модуль не найден в прогрессе' }, { status: 404 })
    }

    // Проверяем, доступен ли модуль
    if (moduleProgress.status === 'locked') {
      return NextResponse.json({ error: 'Модуль заблокирован' }, { status: 403 })
    }

    // Добавляем урок в список прочитанных, если его там еще нет
    if (!moduleProgress.lessonsRead.includes(lessonId)) {
      moduleProgress.lessonsRead.push(lessonId)
      progress.updatedAt = new Date().toISOString()
      
      await progressStore.saveProgress(progress)
    }

    return NextResponse.json({ 
      message: 'Урок отмечен как прочитанный',
      lessonsRead: moduleProgress.lessonsRead.length 
    })
  } catch (error) {
    console.error('Ошибка при отметке урока:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}