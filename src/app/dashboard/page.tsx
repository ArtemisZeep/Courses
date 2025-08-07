'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Leaderboard from '@/components/leaderboard'

interface ModuleProgress {
  moduleId: string
  status: 'locked' | 'available' | 'passed'
  lessonsRead: string[]
  quiz: {
    attempts: any[]
    bestScorePercent?: number
    passedAt?: string
  }
  assignment: {
    submitted: boolean
    submittedAt?: string
    status?: string
    grade?: string // "PASSED" или "FAILED"
    feedback?: string
    gradedAt?: string
  }
  assignments?: {
    total: number
    completed: number
    details: Array<{
      id: string
      submitted: boolean
      grade?: string
    }>
  }
}

interface Module {
  id: string
  title: string
  description: string
  order: number
  _count: {
    lessons: number
    questions: number
  }
  progress: ModuleProgress
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'authenticated') {
      fetchModules()
    }
  }, [status])

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/modules/visible')
      const data = await response.json()

      if (response.ok) {
        setModules(data.allModules || [])
      } else {
        setError(data.error || 'Ошибка при загрузке модулей')
      }
    } catch (error) {
      setError('Ошибка при загрузке модулей')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'locked':
        return <Badge variant="secondary">🔒 Заблокирован</Badge>
      case 'available':
        return <Badge variant="outline">📖 Доступен</Badge>
      case 'passed':
        return <Badge className="bg-green-100 text-green-800">✅ Пройден</Badge>
      default:
        return <Badge variant="secondary">Неизвестно</Badge>
    }
  }

  const getProgressPercentage = (progress: ModuleProgress, totalLessons: number) => {
    if (progress.status === 'passed') return 100
    if (progress.quiz.bestScorePercent !== undefined) {
      return progress.quiz.bestScorePercent
    }
    // Базовый прогресс на основе прочитанных уроков
    return (progress.lessonsRead.length / Math.max(totalLessons, 1)) * 30 // 30% за уроки
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Middleware should redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Привет, {session.user.name}! 👋
              </h1>
              <p className="text-gray-600">Добро пожаловать в курс Excel</p>
            </div>
            <div className="flex items-center space-x-4">
              {session.user.isAdmin && (
                <Link href="/admin">
                  <Button variant="outline">Админ панель</Button>
                </Link>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  // Implement logout
                  window.location.href = '/api/auth/signout'
                }}
              >
                Выход
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Progress Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ваш прогресс</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего модулей</CardTitle>
                <Badge variant="outline">{modules.length}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{modules.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Пройдено</CardTitle>
                <Badge className="bg-green-100 text-green-800">
                  {modules.filter(m => m.progress.status === 'passed').length}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {modules.filter(m => m.progress.status === 'passed').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Доступно</CardTitle>
                <Badge variant="outline">
                  {modules.filter(m => m.progress.status === 'available').length}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {modules.filter(m => m.progress.status === 'available').length}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Модули курса</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <Card key={module.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    {getStatusBadge(module.progress.status)}
                  </div>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Прогресс</span>
                        <span>{Math.round(getProgressPercentage(module.progress, module._count.lessons))}%</span>
                      </div>
                      <Progress 
                        value={getProgressPercentage(module.progress, module._count.lessons)} 
                        className="h-2"
                      />
                    </div>

                    {/* Module Stats */}
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>📚 Уроков: {module._count.lessons}</div>
                      <div>🧪 Вопросов: {module._count.questions}</div>
                      <div>📖 Прочитано: {module.progress.lessonsRead.length}/{module._count.lessons}</div>
                      {module.progress.assignments && (
                        <div>📝 Заданий: {module.progress.assignments.completed}/{module.progress.assignments.total}</div>
                      )}
                      {module.progress.quiz.bestScorePercent !== undefined && (
                        <div>📊 Лучший результат: {module.progress.quiz.bestScorePercent}%</div>
                      )}
                      {(module.progress.assignment.submitted || (module.progress.assignments && module.progress.assignments.completed > 0)) && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="font-medium text-gray-700">📝 Задания:</div>
                          {module.progress.assignments ? (
                            <div className="space-y-1">
                              <div className="text-green-600">✅ Выполнено: {module.progress.assignments.completed}/{module.progress.assignments.total}</div>
                              {module.progress.assignments.details.map(assignment => 
                                assignment.grade !== null && assignment.grade !== undefined && (
                                  <div key={assignment.id} className="flex items-center gap-1">
                                    <span>Оценка:</span>
                                    <Badge 
                                      variant={assignment.grade >= 3 ? 'default' : 'destructive'}
                                      className="text-xs"
                                    >
                                      {assignment.grade} {assignment.grade === 1 ? 'балл' : assignment.grade < 5 ? 'балла' : 'баллов'}
                                    </Badge>
                                  </div>
                                )
                              )}
                            </div>
                          ) : module.progress.assignment.submitted && (
                            <div>
                              <div className="text-green-600">✅ Отправлено</div>
                              {module.progress.assignment.grade !== null && module.progress.assignment.grade !== undefined && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span>Оценка:</span>
                                  <Badge 
                                    variant={module.progress.assignment.grade >= 3 ? 'default' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {module.progress.assignment.grade} {module.progress.assignment.grade === 1 ? 'балл' : module.progress.assignment.grade < 5 ? 'балла' : 'баллов'}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2">
                      {module.progress.status === 'locked' ? (
                        <Button disabled className="w-full">
                          🔒 Заблокирован
                        </Button>
                      ) : (
                        <>
                          <Link href={`/modules/${module.id}`}>
                            <Button className="w-full">
                              {module.progress.status === 'passed' ? 'Повторить' : 'Изучать'}
                            </Button>
                          </Link>
                          {module.progress.quiz.attempts.length > 0 && (
                            <Link href={`/modules/${module.id}/attempts`}>
                              <Button variant="outline" className="w-full">
                                Разбор ошибок
                              </Button>
                            </Link>
                          )}
                        </>
                      )}
                    </div>

                    {/* Assignment Status */}
                    {module.progress.assignment.submitted && (
                      <div className="text-sm p-2 bg-blue-50 border border-blue-200 rounded">
                        📎 Задание отправлено
                        {module.progress.assignment.grade !== undefined && (
                          <div className="font-semibold">Оценка: {module.progress.assignment.grade}/100</div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="mb-8">
          <Leaderboard />
        </div>

        {/* Tips Section */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Советы по обучению</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Все модули доступны для изучения с самого начала</li>
              <li>• Вы можете пересдавать тесты неограниченное количество раз</li>
              <li>• Практические задания помогают закрепить полученные знания</li>
              <li>• В разделе "Разбор ошибок" можно посмотреть правильные ответы</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}