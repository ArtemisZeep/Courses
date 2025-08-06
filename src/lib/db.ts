import { PrismaClient } from '@prisma/client'

// Объявляем глобальную переменную для Prisma
declare global {
  var __prisma: PrismaClient | undefined
}

// Инициализируем клиент базы данных
export const db = globalThis.__prisma || new PrismaClient()

// В режиме разработки сохраняем клиент в глобальной переменной
// чтобы избежать создания множественных подключений
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = db
}