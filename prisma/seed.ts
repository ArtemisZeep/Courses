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

  // Создаем уроки для второго модуля
  const lesson3 = await prisma.lesson.upsert({
    where: { 
      moduleId_order: {
        moduleId: module2.id,
        order: 1
      }
    },
    update: {},
    create: {
      title: 'Импорт данных',
      contentHtml: '<h2>Импорт данных в Excel</h2><p>Научитесь импортировать данные из различных источников.</p><ul><li>Импорт из CSV</li><li>Импорт из базы данных</li><li>Импорт из веб-страниц</li></ul>',
      order: 1,
      moduleId: module2.id,
    },
  })

  const lesson4 = await prisma.lesson.upsert({
    where: { 
      moduleId_order: {
        moduleId: module2.id,
        order: 2
      }
    },
    update: {},
    create: {
      title: 'Обработка данных',
      contentHtml: '<h2>Обработка данных</h2><p>Изучите методы обработки и анализа данных в Excel.</p><p><strong>Темы:</strong> Фильтрация, сортировка, сводные таблицы</p>',
      order: 2,
      moduleId: module2.id,
    },
  })

  // Создаем уроки для третьего модуля
  const lesson5 = await prisma.lesson.upsert({
    where: { 
      moduleId_order: {
        moduleId: module3.id,
        order: 1
      }
    },
    update: {},
    create: {
      title: 'Основные формулы',
      contentHtml: '<h2>Основные формулы Excel</h2><p>Изучите базовые математические и логические формулы.</p><ul><li>СУММ()</li><li>СРЗНАЧ()</li><li>ЕСЛИ()</li><li>СЧЁТ()</li></ul>',
      order: 1,
      moduleId: module3.id,
    },
  })

  const lesson6 = await prisma.lesson.upsert({
    where: { 
      moduleId_order: {
        moduleId: module3.id,
        order: 2
      }
    },
    update: {},
    create: {
      title: 'Продвинутые функции',
      contentHtml: '<h2>Продвинутые функции Excel</h2><p>Изучите сложные функции для работы с данными.</p><p><strong>Функции:</strong> ВПР(), ИНДЕКС(), ПОИСКПОЗ(), СУММЕСЛИ()</p>',
      order: 2,
      moduleId: module3.id,
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
      title: 'Что является фундаментальным строительным блоком в иерархии Excel?',
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
      title: 'Где отображается фактическое содержимое активной ячейки, особенно формулы?',
      description: 'Выберите правильное расположение',
      type: 'single',
      order: 2,
      moduleId: module1.id,
      isFinal: true,
    },
  })

  // Создаем вопросы для второго модуля
  const question3 = await prisma.question.upsert({
    where: { 
      moduleId_order: {
        moduleId: module2.id,
        order: 1
      }
    },
    update: {},
    create: {
      title: 'Какие форматы файлов можно импортировать в Excel?',
      description: 'Выберите все правильные варианты',
      type: 'multiple',
      order: 1,
      moduleId: module2.id,
      isFinal: true,
    },
  })

  const question4 = await prisma.question.upsert({
    where: { 
      moduleId_order: {
        moduleId: module2.id,
        order: 2
      }
    },
    update: {},
    create: {
      title: 'Что такое сводная таблица в Excel?',
      description: 'Выберите правильное определение',
      type: 'single',
      order: 2,
      moduleId: module2.id,
      isFinal: true,
    },
  })

  // Создаем вопросы для третьего модуля
  const question5 = await prisma.question.upsert({
    where: { 
      moduleId_order: {
        moduleId: module3.id,
        order: 1
      }
    },
    update: {},
    create: {
      title: 'Какая функция используется для поиска значения в таблице?',
      description: 'Выберите правильную функцию',
      type: 'single',
      order: 1,
      moduleId: module3.id,
      isFinal: true,
    },
  })

  const question6 = await prisma.question.upsert({
    where: { 
      moduleId_order: {
        moduleId: module3.id,
        order: 2
      }
    },
    update: {},
    create: {
      title: 'Какие функции используются для работы с текстом?',
      description: 'Выберите все правильные варианты',
      type: 'multiple',
      order: 2,
      moduleId: module3.id,
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
      text: 'Книга',
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
      text: 'Лист',
      isCorrect: false,
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
      text: 'Ячейка',
      isCorrect: true,
      order: 3,
      questionId: question1.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question1.id,
        order: 4
      }
    },
    update: {},
    create: {
      text: 'Лента',
      isCorrect: false,
      order: 4,
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
      text: 'В строке состояния',
      isCorrect: false,
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
      text: 'В поле имени',
      isCorrect: false,
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
      text: 'В самой ячейке',
      isCorrect: false,
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
      text: 'В строке формул',
      isCorrect: true,
      order: 4,
      questionId: question2.id,
    },
  })

  // Создаем варианты ответов для третьего вопроса
  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question3.id,
        order: 1
      }
    },
    update: {},
    create: {
      text: 'CSV',
      isCorrect: true,
      order: 1,
      questionId: question3.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question3.id,
        order: 2
      }
    },
    update: {},
    create: {
      text: 'TXT',
      isCorrect: true,
      order: 2,
      questionId: question3.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question3.id,
        order: 3
      }
    },
    update: {},
    create: {
      text: 'XML',
      isCorrect: true,
      order: 3,
      questionId: question3.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question3.id,
        order: 4
      }
    },
    update: {},
    create: {
      text: 'MP3',
      isCorrect: false,
      order: 4,
      questionId: question3.id,
    },
  })

  // Создаем варианты ответов для четвертого вопроса
  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question4.id,
        order: 1
      }
    },
    update: {},
    create: {
      text: 'Таблица с итоговыми данными',
      isCorrect: true,
      order: 1,
      questionId: question4.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question4.id,
        order: 2
      }
    },
    update: {},
    create: {
      text: 'График',
      isCorrect: false,
      order: 2,
      questionId: question4.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question4.id,
        order: 3
      }
    },
    update: {},
    create: {
      text: 'Диаграмма',
      isCorrect: false,
      order: 3,
      questionId: question4.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question4.id,
        order: 4
      }
    },
    update: {},
    create: {
      text: 'Формула',
      isCorrect: false,
      order: 4,
      questionId: question4.id,
    },
  })

  // Создаем варианты ответов для пятого вопроса
  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question5.id,
        order: 1
      }
    },
    update: {},
    create: {
      text: 'СУММ()',
      isCorrect: false,
      order: 1,
      questionId: question5.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question5.id,
        order: 2
      }
    },
    update: {},
    create: {
      text: 'ВПР()',
      isCorrect: true,
      order: 2,
      questionId: question5.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question5.id,
        order: 3
      }
    },
    update: {},
    create: {
      text: 'ЕСЛИ()',
      isCorrect: false,
      order: 3,
      questionId: question5.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question5.id,
        order: 4
      }
    },
    update: {},
    create: {
      text: 'СРЗНАЧ()',
      isCorrect: false,
      order: 4,
      questionId: question5.id,
    },
  })

  // Создаем варианты ответов для шестого вопроса
  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question6.id,
        order: 1
      }
    },
    update: {},
    create: {
      text: 'ЛЕВСИМВ()',
      isCorrect: true,
      order: 1,
      questionId: question6.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question6.id,
        order: 2
      }
    },
    update: {},
    create: {
      text: 'ПРАВСИМВ()',
      isCorrect: true,
      order: 2,
      questionId: question6.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question6.id,
        order: 3
      }
    },
    update: {},
    create: {
      text: 'СЦЕПИТЬ()',
      isCorrect: true,
      order: 3,
      questionId: question6.id,
    },
  })

  await prisma.answerOption.upsert({
    where: { 
      questionId_order: {
        questionId: question6.id,
        order: 4
      }
    },
    update: {},
    create: {
      text: 'СУММ()',
      isCorrect: false,
      order: 4,
      questionId: question6.id,
    },
  })

  // Создаем задания для модулей
  const assignment1 = await prisma.assignment.upsert({
    where: { 
      id: 'assignment1'
    },
    update: {},
    create: {
      id: 'assignment1',
      title: 'Практическое задание: Создание таблицы',
      description: '<h3>Создайте простую таблицу в Excel</h3><p>Создайте таблицу с данными о продажах, включающую:</p><ul><li>Название товара</li><li>Количество</li><li>Цену за единицу</li><li>Общую стоимость</li></ul><p>Используйте формулы для расчета общей стоимости.</p>',
      moduleId: module1.id,
    },
  })

  const assignment2 = await prisma.assignment.upsert({
    where: { 
      id: 'assignment2'
    },
    update: {},
    create: {
      id: 'assignment2',
      title: 'Практическое задание: Импорт данных',
      description: '<h3>Импортируйте данные в Excel</h3><p>Скачайте CSV файл с данными и импортируйте его в Excel. Выполните следующие действия:</p><ul><li>Импортируйте CSV файл</li><li>Очистите данные</li><li>Создайте сводную таблицу</li><li>Постройте график</li></ul>',
      moduleId: module2.id,
    },
  })

  const assignment3 = await prisma.assignment.upsert({
    where: { 
      id: 'assignment3'
    },
    update: {},
    create: {
      id: 'assignment3',
      title: 'Практическое задание: Сложные формулы',
      description: '<h3>Создайте сложные формулы</h3><p>Используя предоставленные данные, создайте формулы для:</p><ul><li>Расчета среднего значения с условием</li><li>Поиска данных с помощью ВПР()</li><li>Обработки текста</li><li>Создания сводных таблиц</li></ul>',
      moduleId: module3.id,
    },
  })

  console.log('✅ База данных успешно заполнена!')
  console.log(`👤 Админ: admin@example.com / admin123`)
  console.log(`👤 Студент: student@example.com / student123`)
  console.log(`📚 Создано модулей: 3`)
  console.log(`📖 Создано уроков: 6`)
  console.log(`❓ Создано вопросов: 6`)
  console.log(`📝 Создано заданий: 3`)
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })