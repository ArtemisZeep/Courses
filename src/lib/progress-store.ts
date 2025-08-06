import { Progress, ProgressSchema } from './schemas'
import { PROGRESS_DIR } from './constants'
import fs from 'fs/promises'
import path from 'path'

// Интерфейс для хранилища прогресса
export interface ProgressStore {
  getProgress(userId: string): Promise<Progress | null>
  saveProgress(progress: Progress): Promise<void>
  initializeProgress(userId: string, moduleIds: string[]): Promise<Progress>
}

// Реализация хранилища прогресса в JSON файлах
export class FileJsonProgressStore implements ProgressStore {
  private progressDir: string

  constructor(progressDir: string = PROGRESS_DIR) {
    this.progressDir = progressDir
  }

  private getFilePath(userId: string): string {
    return path.join(this.progressDir, `${userId}.json`)
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.progressDir)
    } catch {
      await fs.mkdir(this.progressDir, { recursive: true })
    }
  }

  async getProgress(userId: string): Promise<Progress | null> {
    try {
      const filePath = this.getFilePath(userId)
      const data = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(data)
      
      // Валидируем данные через Zod
      const validated = ProgressSchema.parse(parsed)
      return validated
    } catch (error) {
      // Если файл не найден или данные невалидны, возвращаем null
      return null
    }
  }

  async saveProgress(progress: Progress): Promise<void> {
    await this.ensureDirectoryExists()
    
    // Валидируем данные перед сохранением
    const validated = ProgressSchema.parse(progress)
    
    const filePath = this.getFilePath(progress.userId)
    const tempFilePath = `${filePath}.tmp`
    
    try {
      // Записываем во временный файл для атомарности
      await fs.writeFile(tempFilePath, JSON.stringify(validated, null, 2), 'utf-8')
      
      // Атомарно перемещаем файл
      await fs.rename(tempFilePath, filePath)
    } catch (error) {
      // Удаляем временный файл в случае ошибки
      try {
        await fs.unlink(tempFilePath)
      } catch {
        // Игнорируем ошибки удаления
      }
      throw error
    }
  }

  async initializeProgress(userId: string, moduleIds: string[]): Promise<Progress> {
    const now = new Date().toISOString()
    
    const initialProgress: Progress = {
      userId,
      updatedAt: now,
      modules: moduleIds.map((moduleId) => ({
        moduleId,
        status: 'available', // Все модули доступны сразу
        lessonsRead: [],
        quiz: {
          attempts: [],
          bestScorePercent: undefined,
          passedAt: undefined,
        },
        assignment: {
          submitted: false,
          submittedAt: undefined,
          fileUrl: undefined,
          status: undefined,
          grade: undefined,
          feedback: undefined,
        },
      })),
    }
    
    await this.saveProgress(initialProgress)
    return initialProgress
  }
}

// Создаем единственный экземпляр хранилища
export const progressStore = new FileJsonProgressStore()

// Утилитарные функции для работы с прогрессом
export async function getOrCreateProgress(userId: string, moduleIds: string[]): Promise<Progress> {
  let progress = await progressStore.getProgress(userId)
  
  if (!progress) {
    progress = await progressStore.initializeProgress(userId, moduleIds)
  } else {
    // Проверяем, добавились ли новые модули и дозаполняем их
    const existingModuleIds = progress.modules.map(m => m.moduleId)
    const newModuleIds = moduleIds.filter(id => !existingModuleIds.includes(id))
    
    if (newModuleIds.length > 0) {
      for (const moduleId of newModuleIds) {
        progress.modules.push({
          moduleId,
          status: 'available', // Новые модули тоже доступны сразу
          lessonsRead: [],
          quiz: {
            attempts: [],
            bestScorePercent: undefined,
            passedAt: undefined,
          },
          assignment: {
            submitted: false,
            submittedAt: undefined,
            fileUrl: undefined,
            status: undefined,
            grade: undefined,
            feedback: undefined,
          },
        })
      }
      
      progress.updatedAt = new Date().toISOString()
      await progressStore.saveProgress(progress)
    }
  }
  
  return progress
}