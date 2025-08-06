import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Получить задание по ID
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const { id } = await params

    const assignment = await db.assignment.findUnique({
      where: { id },
      include: {
        module: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Задание не найдено' }, { status: 404 })
    }

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Ошибка при получении задания:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Обновить задание
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const { id } = await params
    const formData = await request.formData()
    
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const moduleId = formData.get('moduleId') as string
    const file = formData.get('file') as File | null

    if (!title || !description || !moduleId) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 })
    }

    // Проверяем, существует ли задание
    const existingAssignment = await db.assignment.findUnique({
      where: { id }
    })

    if (!existingAssignment) {
      return NextResponse.json({ error: 'Задание не найдено' }, { status: 404 })
    }

    // Проверяем, существует ли модуль
    const module = await db.module.findUnique({
      where: { id: moduleId }
    })

    if (!module) {
      return NextResponse.json({ error: 'Модуль не найден' }, { status: 404 })
    }

    let fileUrl = existingAssignment.fileUrl

    // Обрабатываем новый файл, если он загружен
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Создаем уникальное имя файла
      const timestamp = Date.now()
      const originalName = file.name
      const extension = originalName.split('.').pop()
      const fileName = `${timestamp}-${originalName}`

      // Создаем директорию, если её нет
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'assignments')
      await mkdir(uploadDir, { recursive: true })

      // Сохраняем файл
      const filePath = join(uploadDir, fileName)
      await writeFile(filePath, buffer)

      fileUrl = `/uploads/assignments/${fileName}`
    }

    // Обновляем задание
    const updatedAssignment = await db.assignment.update({
      where: { id },
      data: {
        title,
        description,
        moduleId,
        fileUrl,
      },
      include: {
        module: {
          select: {
            title: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Задание успешно обновлено',
      assignment: updatedAssignment
    })

  } catch (error) {
    console.error('Ошибка при обновлении задания:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Удалить задание
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const { id } = await params

    // Проверяем, существует ли задание
    const assignment = await db.assignment.findUnique({
      where: { id }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Задание не найдено' }, { status: 404 })
    }

    // Удаляем задание
    await db.assignment.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Задание успешно удалено'
    })

  } catch (error) {
    console.error('Ошибка при удалении задания:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 