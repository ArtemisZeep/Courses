import cron from 'node-cron'
import { writeSnapshotBackup, cleanupOldSnapshots } from './backup'

// Функция для создания снапшота
async function createDailySnapshot() {
  try {
    console.log('🕐 [CRON] Создание ежедневного снапшота...')
    const path = await writeSnapshotBackup()
    console.log('✅ [CRON] Снапшот создан успешно:', path)
  } catch (error) {
    console.error('❌ [CRON] Ошибка при создании снапшота:', error)
  }
}

// Функция для очистки старых бэкапов
async function cleanupOldBackups() {
  try {
    console.log('🧹 [CRON] Очистка старых снапшотов...')
    const removed = await cleanupOldSnapshots(30)
    console.log(`✅ [CRON] Удалено ${removed} старых файлов`)
  } catch (error) {
    console.error('❌ [CRON] Ошибка при очистке:', error)
  }
}

// Инициализация cron задач
export function initCronJobs() {
  console.log('🚀 Инициализация cron задач...')

  // Ежедневный снапшот в 22:00 по московскому времени (19:00 UTC)
  cron.schedule('0 19 * * *', createDailySnapshot, {
    timezone: 'UTC',
    name: 'daily-snapshot'
  })
  console.log('📅 Настроен ежедневный снапшот: 22:00 МСК (19:00 UTC)')

  // Еженедельная очистка в воскресенье в 23:00 МСК (20:00 UTC)
  cron.schedule('0 20 * * 0', cleanupOldBackups, {
    timezone: 'UTC',
    name: 'weekly-cleanup'
  })
  console.log('📅 Настроена еженедельная очистка: воскресенье 23:00 МСК (20:00 UTC)')

  console.log('✅ Cron задачи инициализированы')
}

// Функция для остановки всех cron задач
export function stopCronJobs() {
  console.log('🛑 Остановка cron задач...')
  cron.getTasks().forEach((task, name) => {
    console.log(`Остановка задачи: ${name}`)
    task.stop()
  })
  console.log('✅ Cron задачи остановлены')
}

// Экспорт функций для ручного запуска
export { createDailySnapshot, cleanupOldBackups }
