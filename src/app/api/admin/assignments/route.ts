import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeFile } from 'fs/promises'
import { join } from 'path'

// Получить все задания
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const assignments = await db.assignment.findMany({
      include: {
        module: {
          select: {
            title: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Ошибка при получении заданий:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Создать новое задание
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const moduleId = formData.get('moduleId') as string
    const file = formData.get('file') as File | null

    if (!title || !description || !moduleId) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли модуль
    const existingModule = await db.module.findUnique({
      where: { id: moduleId },
    })

    if (!existingModule) {
      return NextResponse.json(
        { error: 'Модуль не найден' },
        { status: 404 }
      )
    }

    // Обработка загрузки файла
    let fileUrl: string | undefined = undefined
    if (file && file.size > 0) {
      try {
        // Генерируем уникальное имя файла
        const timestamp = Date.now()
        const fileExtension = file.name.split('.').pop() || ''
        const fileName = `assignment_${timestamp}.${fileExtension}`
        
        // Читаем содержимое файла
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Сохраняем файл в папку uploads/assignments
        const filePath = join(process.cwd(), 'public', 'uploads', 'assignments', fileName)
        await writeFile(filePath, buffer)
        
        // Сохраняем URL файла для базы данных
        fileUrl = `/uploads/assignments/${fileName}`
        
        console.log('Файл успешно загружен:', fileName)
      } catch (fileError) {
        console.error('Ошибка при загрузке файла:', fileError)
        return NextResponse.json(
          { error: 'Ошибка при загрузке файла' },
          { status: 500 }
        )
      }
    }

    const assignment = await db.assignment.create({
      data: {
        title,
        description,
        fileUrl,
        moduleId,
      },
      include: {
        module: {
          select: {
            title: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Задание успешно создано', assignment },
      { status: 201 }
    )
  } catch (error) {
    console.error('Ошибка при создании задания:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 