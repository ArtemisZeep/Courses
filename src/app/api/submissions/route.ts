import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeFile } from 'fs/promises'
import { join } from 'path'

// Получить все решения студента
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const submissions = await db.submission.findMany({
      where: {
        userId: session.user.id,
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
      orderBy: {
        submittedAt: 'desc',
      },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Ошибка при получении решений:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Загрузить новое решение
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const formData = await request.formData()
    const assignmentId = formData.get('assignmentId') as string
    const file = formData.get('file') as File | null

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'ID задания обязателен' },
        { status: 400 }
      )
    }

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: 'Файл обязателен' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли задание
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        module: {
          select: {
            title: true,
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Задание не найдено' },
        { status: 404 }
      )
    }

    // Проверяем, не загружал ли уже студент решение для этого задания
    const existingSubmission = await db.submission.findFirst({
      where: {
        userId: session.user.id,
        assignmentId: assignmentId,
      },
    })

    let fileUrl: string
    try {
      // Генерируем уникальное имя файла
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop() || ''
      const fileName = `submission_${session.user.id}_${assignmentId}_${timestamp}.${fileExtension}`
      
      // Читаем содержимое файла
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Сохраняем файл в папку uploads/submissions
      const filePath = join(process.cwd(), 'public', 'uploads', 'submissions', fileName)
      await writeFile(filePath, buffer)
      
      // Сохраняем URL файла для базы данных
      fileUrl = `/uploads/submissions/${fileName}`
      
      console.log('Файл решения успешно загружен:', fileName)
    } catch (fileError) {
      console.error('Ошибка при загрузке файла:', fileError)
      return NextResponse.json(
        { error: 'Ошибка при загрузке файла' },
        { status: 500 }
      )
    }

    // Создаем или обновляем решение
    let submission
    if (existingSubmission) {
      // Обновляем существующее решение
      submission = await db.submission.update({
        where: {
          id: existingSubmission.id,
        },
        data: {
          fileUrl,
          submittedAt: new Date(),
          status: 'NEW',
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
    } else {
      // Создаем новое решение
      submission = await db.submission.create({
        data: {
          userId: session.user.id,
          moduleId: assignment.moduleId, // Добавляем moduleId из assignment
          assignmentId,
          fileUrl,
          status: 'NEW',
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
    }

    return NextResponse.json(
      { 
        message: existingSubmission ? 'Решение обновлено' : 'Решение загружено',
        submission 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Ошибка при загрузке решения:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 