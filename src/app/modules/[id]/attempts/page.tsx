'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface QuestionOption {
  id: string
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  title: string
  type: 'single' | 'multiple'
  options: QuestionOption[]
}

interface Answer {
  questionId: string
  selectedOptionIds: string[]
  isCorrect: boolean
  correctOptionIds: string[]
  question: Question
}

interface Attempt {
  id: string
  attemptId: string
  scorePercent: number
  submittedAt: string
  answers: Answer[]
}

export default function AttemptsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const moduleId = params.id as string

  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null)

  useEffect(() => {
    if (moduleId) {
      fetchAttempts()
    }
  }, [moduleId])

  const fetchAttempts = async () => {
    try {
      const response = await fetch(`/api/quiz/attempts?moduleId=${moduleId}`)
      const data = await response.json()

      if (response.ok) {
        setAttempts(data.attempts)
        if (data.attempts.length > 0) {
          setSelectedAttempt(data.attempts[0]) // Показываем последнюю попытку
        }
      } else {
        setError(data.error || 'Ошибка при загрузке попыток')
      }
    } catch (error) {
      setError('Ошибка при загрузке попыток')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU')
  }

  const getAnswerStatusIcon = (isCorrect: boolean) => {
    return isCorrect ? '✅' : '❌'
  }

  const getOptionStatus = (option: QuestionOption, selectedIds: string[], correctIds: string[]) => {
    const isSelected = selectedIds.includes(option.id)
    const isCorrect = correctIds.includes(option.id)
    
    if (isSelected && isCorrect) return 'correct-selected' // Выбрано правильно
    if (isSelected && !isCorrect) return 'incorrect-selected' // Выбрано неправильно
    if (!isSelected && isCorrect) return 'correct-missed' // Пропущено правильное
    return 'neutral' // Не выбрано и не нужно было выбирать
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка попыток...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/dashboard">
            <Button>Вернуться к курсам</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Link href={`/modules/${moduleId}`} className="text-blue-600 hover:underline text-sm">
                ← Вернуться к модулю
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">
                Разбор ошибок и история попыток
              </h1>
              <p className="text-gray-600">Просмотрите свои ответы и изучите правильные решения</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {attempts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-600 mb-4">
                Нет попыток прохождения теста
              </h2>
              <p className="text-gray-500 mb-6">
                Сначала пройдите тест, чтобы увидеть разбор ошибок
              </p>
              <Link href={`/modules/${moduleId}`}>
                <Button>Пройти тест</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Список попыток */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>История попыток</CardTitle>
                  <CardDescription>
                    Выберите попытку для детального разбора
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {attempts.map((attempt, index) => (
                      <div
                        key={attempt.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedAttempt?.id === attempt.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedAttempt(attempt)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            Попытка {attempts.length - index}
                          </span>
                          <Badge
                            variant={attempt.scorePercent >= 75 ? 'default' : 'secondary'}
                            className={
                              attempt.scorePercent >= 75
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {attempt.scorePercent}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(attempt.submittedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Детальный разбор */}
            <div className="lg:col-span-2">
              {selectedAttempt ? (
                <div className="space-y-6">
                  {/* Сводка */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Результат попытки
                        <Badge
                          variant={selectedAttempt.scorePercent >= 75 ? 'default' : 'secondary'}
                          className={
                            selectedAttempt.scorePercent >= 75
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {selectedAttempt.scorePercent}%
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Дата: {formatDate(selectedAttempt.submittedAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {selectedAttempt.answers.filter(a => a.isCorrect).length}
                          </div>
                          <div className="text-sm text-gray-500">Правильно</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">
                            {selectedAttempt.answers.filter(a => !a.isCorrect).length}
                          </div>
                          <div className="text-sm text-gray-500">Неправильно</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {selectedAttempt.answers.length}
                          </div>
                          <div className="text-sm text-gray-500">Всего</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Разбор по вопросам */}
                  {selectedAttempt.answers.map((answer, index) => (
                    <Card key={answer.questionId}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Вопрос {index + 1}</span>
                          <div className="flex items-center space-x-2">
                                                <Badge variant={answer.question.type === 'single' ? 'default' : 'secondary'}>
                      {answer.question.type === 'single' ? 'Один ответ' : 'Несколько ответов'}
                            </Badge>
                            <span className="text-2xl">
                              {getAnswerStatusIcon(answer.isCorrect)}
                            </span>
                          </div>
                        </CardTitle>
                        <CardDescription>{answer.question.title}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {answer.question.options.map((option) => {
                            const status = getOptionStatus(
                              option,
                              answer.selectedOptionIds,
                              answer.correctOptionIds
                            )
                            
                            let className = 'p-3 border rounded-lg flex items-center justify-between '
                            let icon = ''
                            
                            switch (status) {
                              case 'correct-selected':
                                className += 'border-green-500 bg-green-50'
                                icon = '✅'
                                break
                              case 'incorrect-selected':
                                className += 'border-red-500 bg-red-50'
                                icon = '❌'
                                break
                              case 'correct-missed':
                                className += 'border-yellow-500 bg-yellow-50'
                                icon = '⚠️'
                                break
                              default:
                                className += 'border-gray-200'
                            }

                            return (
                              <div key={option.id} className={className}>
                                <span>{option.text}</span>
                                <div className="flex items-center space-x-2">
                                  {status === 'correct-selected' && (
                                    <Badge className="bg-green-100 text-green-800">
                                      Правильно выбрано
                                    </Badge>
                                  )}
                                  {status === 'incorrect-selected' && (
                                    <Badge className="bg-red-100 text-red-800">
                                      Неправильно выбрано
                                    </Badge>
                                  )}
                                  {status === 'correct-missed' && (
                                    <Badge className="bg-yellow-100 text-yellow-800">
                                      Пропущено правильное
                                    </Badge>
                                  )}
                                  <span className="text-lg">{icon}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        
                        {!answer.isCorrect && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">💡 Правильный ответ:</h4>
                            <div className="text-sm text-blue-800">
                              {answer.question.options
                                .filter(opt => answer.correctOptionIds.includes(opt.id))
                                .map(opt => opt.text)
                                .join(answer.question.type === 'multiple' ? ', ' : '')
                              }
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {/* Действия */}
                  <div className="text-center">
                    <Link href={`/modules/${moduleId}`}>
                      <Button size="lg">
                        {selectedAttempt.scorePercent >= 75 ? 'Вернуться к модулю' : 'Пересдать тест'}
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-500">
                      Выберите попытку из списка для просмотра детального разбора
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}