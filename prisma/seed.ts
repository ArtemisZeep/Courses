import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...')

  // Создаем админа
  const adminPassword = await bcryptjs.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Администратор',
      password: adminPassword,
      isAdmin: true,
    },
  })

  // Создаем тестового студента
  const studentPassword = await bcryptjs.hash('student123', 12)
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      name: 'Тестовый Студент',
      password: studentPassword,
      isAdmin: false,
    },
  })

  // Создаем модули
  const module1 = await prisma.module.upsert({
    where: { order: 1 },
    update: { isActive: true },
    create: {
      title: 'Основы Excel',
      description: 'Изучите базовые принципы работы с Excel: ячейки, формулы, форматирование',
      order: 1,
      isActive: true,
    },
  })

  const module2 = await prisma.module.upsert({
    where: { order: 2 },
    update: { isActive: true },
    create: {
      title: 'Работа с данными',
      description: 'Импорт, экспорт и обработка данных в Excel',
      order: 2,
      isActive: true,
    },
  })

  const module3 = await prisma.module.upsert({
    where: { order: 3 },
    update: { isActive: true },
    create: {
      title: 'Формулы и функции',
      description: 'Создание сложных формул и использование встроенных функций',
      order: 3,
      isActive: true,
    },
  })

  // Создаем уроки для первого модуля
  const lesson1 = await prisma.lesson.upsert({
    where: { 
      moduleId_order: {
        moduleId: module1.id,
        order: 1
      }
    },
    update: {},
    create: {
      title: 'Введение в Excel',
      contentHtml: '<h2>Добро пожаловать в Excel!</h2><p>В этом уроке вы изучите основы работы с электронными таблицами.</p><ul><li>Что такое Excel</li><li>Интерфейс программы</li><li>Основные элементы</li></ul>',
      order: 1,
      moduleId: module1.id,
    },
  })

  const lesson2 = await prisma.lesson.upsert({
    where: { 
      moduleId_order: {
        moduleId: module1.id,
        order: 2
      }
    },
    update: {},
    create: {
      title: 'Работа с ячейками',
      contentHtml: '<h2>Работа с ячейками</h2><p>Научитесь выделять, редактировать и форматировать ячейки.</p><p><strong>Важно:</strong> Ячейки - это основа любой таблицы в Excel.</p>',
      order: 2,
      moduleId: module1.id,
    },
  })

  // Создаем вопросы для первого модуля
  const question1 = await prisma.question.upsert({
    where: { 
      moduleId_order: {
        moduleId: module1.id,
        order: 1
      }
    },
    update: {},
    create: {
      title: 'Что такое Excel?',
      description: 'Выберите правильное определение',
      type: 'single',
      order: 1,
      moduleId: module1.id,
      isFinal: true,
    },
  })

  const question2 = await prisma.question.upsert({
    where: { 
      moduleId_order: {
        moduleId: module1.id,
        order: 2
      }
    },
    update: {},
    create: {
      title: 'Какие элементы интерфейса Excel вы знаете?',
      description: 'Выберите все правильные варианты',
      type: 'multiple',
      order: 2,
      moduleId: module1.id,
      isFinal: true,
    },
  })

  // Создаем варианты ответов для первого вопроса
  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question1.id,
        order: 1
      }
    },
    update: {},
    create: {
      text: 'Программа для работы с текстом',
      isCorrect: false,
      order: 1,
      questionId: question1.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question1.id,
        order: 2
      }
    },
    update: {},
    create: {
      text: 'Программа для работы с электронными таблицами',
      isCorrect: true,
      order: 2,
      questionId: question1.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question1.id,
        order: 3
      }
    },
    update: {},
    create: {
      text: 'Программа для создания презентаций',
      isCorrect: false,
      order: 3,
      questionId: question1.id,
    },
  })

  // Создаем варианты ответов для второго вопроса
  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question2.id,
        order: 1
      }
    },
    update: {},
    create: {
      text: 'Лента инструментов',
      isCorrect: true,
      order: 1,
      questionId: question2.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question2.id,
        order: 2
      }
    },
    update: {},
    create: {
      text: 'Панель формул',
      isCorrect: true,
      order: 2,
      questionId: question2.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question2.id,
        order: 3
      }
    },
    update: {},
    create: {
      text: 'Лист с ячейками',
      isCorrect: true,
      order: 3,
      questionId: question2.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question2.id,
        order: 4
      }
    },
    update: {},
    create: {
      text: 'Блокнот',
      isCorrect: false,
      order: 4,
      questionId: question2.id,
    },
  })

  console.log('✅ База данных успешно заполнена!')
  console.log(`👤 Админ: admin@example.com / admin123`)
  console.log(`👤 Студент: student@example.com / student123`)
  console.log(`📚 Создано модулей: 3`)
  console.log(`📖 Создано уроков: 2`)
  console.log(`❓ Создано вопросов: 2`)
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })