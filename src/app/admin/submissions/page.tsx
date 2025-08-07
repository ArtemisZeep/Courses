'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Submission {
  id: string
  userId: string
  moduleId: string
  fileUrl: string
  status: 'NEW' | 'GRADED'
  grade?: number // Баллы от 0 до 5
  feedback?: string
  submittedAt: string
  gradedAt?: string
  user: {
    name: string
    email: string
  }
  module: {
    title: string
  }
}

export default function SubmissionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [grading, setGrading] = useState(false)
  const [grade, setGrade] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.isAdmin) {
      router.push('/dashboard')
    } else {
      fetchSubmissions()
    }
  }, [session, status, router])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/submissions')
      const data = await response.json()

      if (response.ok) {
        setSubmissions(data.submissions)
      } else {
        setError(data.error || 'Ошибка при загрузке заданий')
      }
    } catch (error) {
      setError('Ошибка при загрузке заданий')
    } finally {
      setLoading(false)
    }
  }

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubmission || grade === null) return

    setGrading(true)
    try {
      const response = await fetch(`/api/admin/submissions/${selectedSubmission.id}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grade,
          feedback,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Обновляем список заданий
        setSubmissions(submissions.map(s => 
          s.id === selectedSubmission.id 
            ? { ...s, grade, feedback, status: 'GRADED' as const }
            : s
        ))
        setSelectedSubmission(null)
        setGrade(null)
        setFeedback('')
        alert('Оценка сохранена')
      } else {
        alert(data.error || 'Ошибка при сохранении оценки')
      }
    } catch (error) {
      alert('Ошибка при сохранении оценки')
    } finally {
      setGrading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <Badge variant="outline">Новое</Badge>
      case 'GRADED':
        return <Badge className="bg-green-100 text-green-800">Проверено</Badge>
      default:
        return <Badge variant="secondary">Неизвестно</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
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
              <Link href="/admin" className="text-blue-600 hover:underline text-sm">
                ← Вернуться к админ панели
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">
                Проверка заданий
              </h1>
              <p className="text-gray-600">Просмотр и оценка отправленных решений</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = '/api/auth/signout'
              }}
            >
              Выход
            </Button>
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего заданий</CardTitle>
              <Badge variant="outline">{submissions.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Новые</CardTitle>
              <Badge className="bg-blue-100 text-blue-800">
                {submissions.filter(s => s.status === 'NEW').length}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.filter(s => s.status === 'NEW').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Проверенные</CardTitle>
              <Badge className="bg-green-100 text-green-800">
                {submissions.filter(s => s.status === 'GRADED').length}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.filter(s => s.status === 'GRADED').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Зачтено</CardTitle>
              <Badge variant="outline">
                {submissions.filter(s => s.grade === 'PASSED').length}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.filter(s => s.grade === 'PASSED').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Отправленные задания</CardTitle>
            <CardDescription>
              Список всех отправленных решений с возможностью оценки
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Пока нет отправленных заданий</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Студент</TableHead>
                    <TableHead>Модуль</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Оценка</TableHead>
                    <TableHead>Комментарий</TableHead>
                    <TableHead>Отправлено</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions
                    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                    .map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{submission.user.name}</div>
                            <div className="text-sm text-gray-500">{submission.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{submission.module.title}</TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        <TableCell>
                          {submission.grade !== null && submission.grade !== undefined ? (
                            <Badge variant={submission.grade >= 3 ? 'default' : 'destructive'}>
                              {submission.grade} {submission.grade === 1 ? 'балл' : submission.grade < 5 ? 'балла' : 'баллов'}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">Не оценено</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {submission.feedback ? (
                            <div className="max-w-xs">
                              <div className="text-sm text-gray-600 truncate" title={submission.feedback}>
                                {submission.feedback.length > 50 
                                  ? `${submission.feedback.substring(0, 50)}...` 
                                  : submission.feedback
                                }
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs p-0 h-auto mt-1"
                                onClick={() => {
                                  setSelectedFeedback(submission.feedback)
                                  setShowFeedbackModal(true)
                                }}
                              >
                                {submission.feedback.length > 50 ? 'Показать полностью' : 'Просмотреть'}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Нет комментария</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              {submission.status === 'NEW' ? 'Оценить' : 'Изменить оценку'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                            >
                              <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                                Скачать
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Grading Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Оценка задания
              </h3>
              
              <div className="space-y-4 mb-4">
                <div>
                  <Label className="text-sm font-medium">Студент</Label>
                  <p className="text-sm">{selectedSubmission.user.name}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Модуль</Label>
                  <p className="text-sm">{selectedSubmission.module.title}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Файл</Label>
                  <a 
                    href={selectedSubmission.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Скачать решение
                  </a>
                </div>
              </div>

              <form onSubmit={handleGrade} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Оценка</Label>
                  <select
                    id="grade"
                    value={grade === null ? "" : grade.toString()}
                    onChange={(e) => setGrade(e.target.value === "" ? null : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Выберите оценку</option>
                    <option value="0">0 баллов</option>
                    <option value="1">1 балл</option>
                    <option value="2">2 балла</option>
                    <option value="3">3 балла</option>
                    <option value="4">4 балла</option>
                    <option value="5">5 баллов</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Комментарий</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Ваши комментарии к работе..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={grading}>
                    {grading ? 'Сохранение...' : 'Сохранить оценку'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setSelectedSubmission(null)
                      setGrade(null)
                      setFeedback('')
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
              <h3 className="text-lg font-semibold mb-4">
                Комментарий к работе
              </h3>
              
              <div className="space-y-4 flex-1 overflow-hidden">
                <div className="flex flex-col h-full">
                  <Label className="text-sm font-medium">Полный комментарий:</Label>
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md flex-1 overflow-y-auto max-h-[50vh]">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedFeedback}
                    </p>
                  </div>
                </div>
              </div>
                
              <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowFeedbackModal(false)
                    setSelectedFeedback('')
                  }}
                >
                  Закрыть
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 