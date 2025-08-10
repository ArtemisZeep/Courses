'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import styles from './page.module.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

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
    grade?: number // Оценка от 0 до 5 баллов
    feedback?: string
    gradedAt?: string
  }
  assignments?: {
    total: number
    completed: number
    details: Array<{
      id: string
      submitted: boolean
      grade?: number
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

interface LeaderboardUser {
  id: string
  name: string
  email: string
  rating: number
  createdAt: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [showAllUsers, setShowAllUsers] = useState(false)
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchModules()
      fetchLeaderboard(5) // Загружаем топ-5
    }
  }, [status])

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/modules/visible')
      const data = await response.json()

      if (response.ok) {
        // Используем рассчитанные на бэкенде статусы доступности
        setModules(data.modules || data.allModules || [])
      } else {
        setError(data.error || 'Ошибка при загрузке модулей')
      }
    } catch (error) {
      setError('Ошибка при загрузке модулей')
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaderboard = async (limit: number = 5) => {
    try {
      setLoadingLeaderboard(true)
      const response = await fetch(`/api/leaderboard?limit=${limit}`)
      const data = await response.json()

      if (response.ok) {
        setLeaderboard(data.users || [])
      } else {
        console.error('Ошибка при загрузке рейтинга:', data.error)
      }
    } catch (error) {
      console.error('Ошибка при загрузке рейтинга:', error)
    } finally {
      setLoadingLeaderboard(false)
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
      <div className={styles.centerScreen}>
        <div className={styles.textCenter}>
          <div className={styles.spinnerLg}></div>
          <p className={styles.muted}>Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Middleware should redirect
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerBar}>
            <div>
              <h1 className={styles.title}>
                Привет, {session.user.name}! 👋
              </h1>
              <p className={styles.subTitle}>Добро пожаловать в курс Excel</p>
            </div>
            <div className={styles.actions}>
              {session.user.isAdmin && (
                <Link href="/admin">
                  <Button variant="outline">Админ панель</Button>
                </Link>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  console.log('[Dashboard] Logout clicked. Navigating to /auth/signout')
                  window.location.href = '/auth/signout'
                }}
              >
                Выход
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {error && (
          <div className={styles.alertError}>
            <p className={styles.alertErrorText}>{error}</p>
          </div>
        )}

        {/* Progress Overview */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Ваш прогресс</h2>
          <div className={styles.grid3}>
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
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Модули курса</h2>
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
                      <div className={styles.progressBarLabel}>
                        <span>Прогресс</span>
                        <span>{Math.round(getProgressPercentage(module.progress, module._count.lessons))}%</span>
                      </div>
                      <Progress 
                        value={getProgressPercentage(module.progress, module._count.lessons)} 
                        className={styles.progressBarSm}
                      />
                    </div>

                    {/* Module Stats */}
                    <div className={styles.stats}>
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
                        <div className={styles.dividerTop}>
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
                                     className={styles.badgeXs}
                                    >
                                      {assignment.grade}/5 баллов
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
                                     className={styles.badgeXs}
                                  >
                                    {module.progress.assignment.grade}/5 баллов
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
                        <Button disabled className={styles.btnFull}>
                          🔒 Заблокирован
                        </Button>
                      ) : (
                        <>
                          <Link href={`/modules/${module.id}`}>
                            <Button className={styles.btnFull}>
                              {module.progress.status === 'passed' ? 'Повторить' : 'Изучать'}
                            </Button>
                          </Link>
                          {module.progress.quiz.attempts.length > 0 && (
                            <Link href={`/modules/${module.id}/attempts`}>
                              <Button variant="outline" className={styles.btnFull}>
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
                        {module.progress.assignment.grade !== null && module.progress.assignment.grade !== undefined && (
                          <div className="font-semibold">Оценка: {module.progress.assignment.grade}/5 баллов</div>
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
        <div className={styles.section}>
          <div className={styles.leadersHeader}>
            <div className={styles.leadersLeft}>
              <div className={styles.trophyCircle}>
                <span className={styles.trophyEmoji}>🏆</span>
              </div>
              <div>
                <h2 className={styles.leadersTitle}>Рейтинг студентов</h2>
                <p className={styles.leadersSub}>Топ лидеров по баллам</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (showAllUsers) {
                  fetchLeaderboard(5)
                  setShowAllUsers(false)
                } else {
                  fetchLeaderboard(50)
                  setShowAllUsers(true)
                }
              }}
              disabled={loadingLeaderboard}
              className={styles.btnPad}
            >
              {loadingLeaderboard ? (
                <div className={styles.spinnerMd}></div>
              ) : null}
              {showAllUsers ? 'Показать топ-5' : 'Посмотреть всех'}
            </Button>
          </div>
          
          <Card className={styles.leadersCard}>
            <CardContent className={styles.leadersCardPad}>
              {loadingLeaderboard ? (
                <div className={styles.leadersLoading}>
                  <div className={styles.spinnerMd}></div>
                  <span className={styles.loadingText}>Загрузка рейтинга...</span>
                </div>
              ) : leaderboard.length > 0 ? (
                <div className={styles.leadersList}>
                  {leaderboard.map((user, index) => {
                    const isTop3 = index < 3;
                    const getMedalColor = (position: number) => {
                      switch (position) {
                        case 0: return styles.gold;
                        case 1: return styles.silver;
                        case 2: return styles.bronze;
                        default: return styles.medalDefault;
                      }
                    };
                    
                    const getMedalIcon = (position: number) => {
                      switch (position) {
                        case 0: return '🥇';
                        case 1: return '🥈';
                        case 2: return '🥉';
                        default: return '';
                      }
                    };

                    const getBorderColor = (position: number) => {
                      switch (position) {
                        case 0: return styles.borderGold;
                        case 1: return styles.borderSilver;
                        case 2: return styles.borderBronze;
                        default: return '';
                      }
                    };

                    const getBgColor = (position: number) => {
                      switch (position) {
                        case 0: return styles.bgGold;
                        case 1: return styles.bgSilver;
                        case 2: return styles.bgBronze;
                        default: return styles.bgDefault;
                      }
                    };

                    return (
                      <div key={user.id} className={`${styles.leaderRow} ${getBgColor(index)} ${getBorderColor(index)}`}>
                        <div className={styles.leaderLeft}>
                          <div className={`${styles.leaderMedal} ${getMedalColor(index)}`}>
                            {isTop3 ? (
                              <span className={styles.medalIcon}>
                                {getMedalIcon(index)}
                              </span>
                            ) : null}
                            {index + 1}
                          </div>
                          <div>
                            <div className={styles.leaderName}>{user.name}</div>
                            <div className={styles.leaderEmail}>{user.email}</div>
                          </div>
                        </div>
                        <div className={styles.leaderRight}>
                          <div className={isTop3 ? styles.scoreTop : styles.scoreDefault}>
                            {user.rating}
                          </div>
                          <div className={styles.scoreNote}>баллов</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Пока нет данных для рейтинга
                </div>
              )}
            </CardContent>
          </Card>
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