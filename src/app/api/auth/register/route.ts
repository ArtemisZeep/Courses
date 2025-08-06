import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { RegisterSchema } from '@/lib/schemas'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Валидация входных данных
    const validatedFields = RegisterSchema.safeParse(body)
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Неверные данные', details: validatedFields.error.issues },
        { status: 400 }
      )
    }

    const { name, email, password } = validatedFields.data

    // Проверяем, не существует ли уже пользователь с таким email
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    // Хешируем пароль
    const hashedPassword = await hashPassword(password)

    // Создаем пользователя
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isAdmin: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      { message: 'Пользователь успешно зарегистрирован', user },
      { status: 201 }
    )
  } catch (error) {
    console.error('Ошибка регистрации:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}