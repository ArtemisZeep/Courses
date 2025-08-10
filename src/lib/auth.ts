import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcryptjs from 'bcryptjs'
import { db } from './db'
import { LoginSchema } from './schemas'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Валидируем входные данные
        const validatedFields = LoginSchema.safeParse(credentials)
        if (!validatedFields.success) {
          return null
        }

        const { email, password } = validatedFields.data

        try {
          // Ищем пользователя в базе данных
          const user = await db.user.findUnique({
            where: { email },
          })

          if (!user) {
            return null
          }

          // Проверяем пароль
          const isPasswordValid = await bcryptjs.compare(password, user.password)
          if (!isPasswordValid) {
            return null
          }

          // Возвращаем данные пользователя для сессии
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin,
          }
        } catch (error) {
          console.error('Ошибка аутентификации:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = (user as any).isAdmin
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
  },
})

// Утилитарная функция для хеширования пароля
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12)
}

// Утилитарная функция для проверки пароля
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcryptjs.compare(password, hashedPassword)
}