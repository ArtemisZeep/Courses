import { z } from 'zod'
import { QuestionType, SubmissionStatus } from '@prisma/client'

// Схема регистрации пользователя
export const RegisterSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
})

// Схема входа в систему
export const LoginSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(1, 'Пароль обязателен'),
})

// Схема создания модуля
export const ModuleSchema = z.object({
  title: z.string().min(1, 'Название модуля обязательно'),
  description: z.string().optional(),
  order: z.number().int().positive('Порядок должен быть положительным числом'),
  isActive: z.boolean().default(true),
})

// Схема создания урока
export const LessonSchema = z.object({
  title: z.string().min(1, 'Название урока обязательно'),
  contentHtml: z.string().optional(),
  googleDocUrl: z.string().url('Неверный формат ссылки').optional(),
  order: z.number().int().positive('Порядок должен быть положительным числом'),
  moduleId: z.string().cuid('Неверный ID модуля'),
})

// Схема создания вопроса
export const QuestionSchema = z.object({
  title: z.string().min(1, 'Текст вопроса обязателен'),
  description: z.string().optional(),
  type: z.nativeEnum(QuestionType),
  order: z.number().int().positive('Порядок должен быть положительным числом'),
  moduleId: z.string().cuid('Неверный ID модуля'),
  isFinal: z.boolean().default(true),
})

// Схема варианта ответа
export const AnswerOptionSchema = z.object({
  text: z.string().min(1, 'Текст варианта ответа обязателен'),
  isCorrect: z.boolean().default(false),
  order: z.number().int().positive('Порядок должен быть положительным числом'),
  questionId: z.string().cuid('Неверный ID вопроса'),
})

// Схема отправки теста
export const QuizSubmissionSchema = z.object({
  moduleId: z.string().cuid('Неверный ID модуля'),
  answers: z.array(z.object({
    questionId: z.string().cuid('Неверный ID вопроса'),
    selectedOptionIds: z.array(z.string().cuid('Неверный ID варианта ответа')),
  })),
})

// Схема отметки о прочтении урока
export const LessonReadSchema = z.object({
  moduleId: z.string().cuid('Неверный ID модуля'),
  lessonId: z.string().cuid('Неверный ID урока'),
})

// Схема оценки задания
export const GradeSubmissionSchema = z.object({
  grade: z.number().int().min(0).max(100, 'Оценка должна быть от 0 до 100'),
  feedback: z.string().optional(),
})

// Схема прогресса студента
export const ProgressSchema = z.object({
  userId: z.string().cuid(),
  updatedAt: z.string().datetime(),
  modules: z.array(z.object({
    moduleId: z.string(),
    status: z.enum(['locked', 'available', 'passed']),
    lessonsRead: z.array(z.string()),
    quiz: z.object({
      attempts: z.array(z.object({
        attemptId: z.string(),
        submittedAt: z.string().datetime(),
        scorePercent: z.number(),
        answers: z.array(z.object({
          questionId: z.string(),
          selectedOptionIds: z.array(z.string()),
          isCorrect: z.boolean(),
          correctOptionIds: z.array(z.string()),
        })),
      })),
      bestScorePercent: z.number().optional(),
      passedAt: z.string().datetime().optional(),
    }),
    assignment: z.object({
      submitted: z.boolean(),
      submittedAt: z.string().datetime().optional(),
      fileUrl: z.string().optional(),
      status: z.nativeEnum(SubmissionStatus).optional(),
      grade: z.number().int().min(0).max(100).optional(),
      feedback: z.string().optional(),
    }),
  })),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type ModuleInput = z.infer<typeof ModuleSchema>
export type LessonInput = z.infer<typeof LessonSchema>
export type QuestionInput = z.infer<typeof QuestionSchema>
export type AnswerOptionInput = z.infer<typeof AnswerOptionSchema>
export type QuizSubmissionInput = z.infer<typeof QuizSubmissionSchema>
export type LessonReadInput = z.infer<typeof LessonReadSchema>
export type GradeSubmissionInput = z.infer<typeof GradeSubmissionSchema>
export type Progress = z.infer<typeof ProgressSchema>