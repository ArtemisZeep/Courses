'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import GoogleDocViewer from '@/components/google-doc-viewer'
import Quiz from '@/components/quiz'

interface Lesson {
  id: string
  title: string
  contentHtml?: string
  googleDocUrl?: string
  order: number
}

interface AnswerOption {
  id: string
  text: string
  order: number
}

interface Question {
  id: string
  title: string
  description?: string
  type: 'single' | 'multiple'
  order: number
  options: AnswerOption[]
}

interface Assignment {
  id: string
  title: string
  description: string
  fileUrl?: string
  createdAt: string
}

interface Module {
  id: string
  title: string
  description: string
  order: number
  attachmentUrl?: string
  lessons: Lesson[]
  questions: Question[]
  assignments: Assignment[]
}

export default function ModulePage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const moduleId = params.id as string

  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('lessons')
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizResult, setQuizResult] = useState<any>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [submissions, setSubmissions] = useState<Record<string, any>>({})
  const [submissionDetails, setSubmissionDetails] = useState<Record<string, any>>({})
  const [readLessons, setReadLessons] = useState<string[]>([])

  useEffect(() => {
    if (moduleId) {
      fetchModule()
    }
  }, [moduleId])

  // Загружаем submissions при изменении module
  useEffect(() => {
    if (module && module.assignments.length > 0) {
      fetchSubmissions()
    }
  }, [module])

  const fetchModule = async () => {
    try {
      const response = await fetch(`/api/modules/${moduleId}`)
      const data = await response.json()

      if (response.ok) {
        setModule(data.module)
        // Загружаем предыдущие результаты теста
        await fetchQuizResults()
        // Загружаем прогресс пользователя
        await fetchProgress()
        // fetchSubmissions будет вызван автоматически в useEffect при изменении module
      } else {
        setError(data.error || 'Ошибка при загрузке модуля')
      }
    } catch (error) {
      setError('Ошибка при загрузке модуля')
    } finally {
      setLoading(false)
    }
  }

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/progress/me')
      if (response.ok) {
        const data = await response.json()
        const moduleProgress = data.progress.modules.find((m: any) => m.moduleId === moduleId)
        if (moduleProgress) {
          setReadLessons(moduleProgress.lessonsRead || [])
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке прогресса:', error)
    }
  }

  const fetchQuizResults = async () => {
    try {
      const response = await fetch(`/api/quiz/submit?moduleId=${moduleId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.result) {
          setQuizResult(data.result)
          setQuizSubmitted(true)
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке результатов теста:', error)
    }
  }

  const fetchSubmissions = async () => {
    if (!module) return
    
    try {
      const submissionsData: Record<string, any> = {}
      const detailsData: Record<string, any> = {}
      
      for (const assignment of module.assignments) {
        const response = await fetch(`/api/submissions/${assignment.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.submission) {
            submissionsData[assignment.id] = data.submission
            // Получаем детали с оценкой
            const detailsResponse = await fetch(`/api/submissions/${assignment.id}/details`)
            if (detailsResponse.ok) {
              const detailsResponseData = await detailsResponse.json()
              if (detailsResponseData.submission) {
                detailsData[assignment.id] = detailsResponseData.submission
              }
            }
          }
        }
      }
      
      setSubmissions(submissionsData)
      setSubmissionDetails(detailsData)
    } catch (error) {
      console.error('Ошибка при загрузке решений:', error)
    }
  }

  const markLessonAsRead = async (lessonId: string) => {
    try {
      const response = await fetch('/api/progress/lessons/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId,
          lessonId,
        }),
      })
      
      if (response.ok) {
        // Добавляем урок в список прочитанных
        setReadLessons(prev => [...prev, lessonId])
      }
    } catch (error) {
      console.error('Ошибка при отметке урока:', error)
    }
  }



  const retakeQuiz = () => {
    setQuizSubmitted(false)
    setQuizResult(null)
    setError('')
    // Переключаемся на вкладку теста для лучшего UX
    setActiveTab('quiz')
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadError('')
      setUploadSuccess('')
    }
  }

  const handleUploadSubmission = async (assignmentId: string) => {
    if (!selectedFile) {
      setUploadError('Выберите файл для загрузки')
      return
    }

    setUploading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const formData = new FormData()
      formData.append('assignmentId', assignmentId)
      formData.append('file', selectedFile)

      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setUploadSuccess(data.message)
        setSelectedFile(null)
        // Очищаем input файла
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        // Обновляем список решений
        await fetchSubmissions()
      } else {
        setUploadError(data.error || 'Ошибка при загрузке файла')
      }
    } catch (error) {
      setUploadError('Ошибка сети. Проверьте подключение.')
    } finally {
      setUploading(false)
    }
  }

  const submitQuiz = async (answers: { questionId: string; selectedOptionIds: string[] }[]) => {
    try {
      setLoading(true)
      setError('') // Очищаем предыдущие ошибки

      console.log('Отправляем тест:', { moduleId, answers })

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId,
          answers,
        }),
      })

      const data = await response.json()
      console.log('Ответ сервера:', data)

      if (response.ok) {
        setQuizResult(data)
        setQuizSubmitted(true)
        
        // Автоматически переключаемся на вкладку с результатами теста
        // Результаты будут показаны в компоненте Quiz
      } else {
        const errorMessage = data.details ? 
          `${data.error}\nДетали: ${data.details}` : 
          data.error || 'Ошибка при отправке теста'
        setError(errorMessage)
        console.error('Ошибка API:', response.status, data)
      }
    } catch (error) {
      console.error('Ошибка сети:', error)
      setError('Ошибка сети. Проверьте подключение к интернету.')
    } finally {
      setLoading(false)
    }
  }

  const downloadAssignment = () => {
    if (module?.attachmentUrl) {
      window.open(module.attachmentUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка модуля...</p>
        </div>
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка</h1>
          <p className="text-gray-600 mb-4">{error || 'Модуль не найден'}</p>
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
              <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
                ← Вернуться к курсам
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">
                {module.title}
              </h1>
              <p className="text-gray-600">{module.description}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lessons">📚 Уроки ({module.lessons.length})</TabsTrigger>
            <TabsTrigger value="quiz">🧪 Тест ({module.questions.length})</TabsTrigger>
            <TabsTrigger value="assignment">💼 Задание</TabsTrigger>
          </TabsList>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-6">
            {module.lessons.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">В этом модуле пока нет уроков</p>
                </CardContent>
              </Card>
            ) : (
              module.lessons.map((lesson) => (
                <Card key={lesson.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {lesson.title}
                      {readLessons.includes(lesson.id) ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          ✓ Прочитано
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => markLessonAsRead(lesson.id)}
                        >
                          ✓ Отметить как прочитанный
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lesson.googleDocUrl ? (
                      <GoogleDocViewer 
                        url={lesson.googleDocUrl} 
                        title={lesson.title} 
                      />
                    ) : lesson.contentHtml ? (
                      <div 
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: lesson.contentHtml }}
                      />
                    ) : (
                      <p className="text-gray-500">Контент урока не найден</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz" className="space-y-6">
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600">❌</span>
                    <div>
                      <h4 className="font-semibold text-red-800">Ошибка</h4>
                      <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setError('')}
                  >
                    Закрыть
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {module.questions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">В этом модуле пока нет вопросов</p>
                </CardContent>
              </Card>
            ) : (
              <Quiz
                questions={module.questions}
                onSubmit={submitQuiz}
                onRetake={retakeQuiz}
                isSubmitted={quizSubmitted}
                result={quizResult}
              />
            )}
          </TabsContent>

          {/* Assignment Tab */}
          <TabsContent value="assignment" className="space-y-6">
            {module.assignments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">В этом модуле пока нет заданий</p>
                </CardContent>
              </Card>
            ) : (
              module.assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {assignment.title}
                      <Badge variant="outline" className="text-xs">
                        Новое
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: assignment.description }}
                      />
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {assignment.fileUrl ? (
                      <div className="space-y-3">
                        <Button 
                          onClick={() => window.open(assignment.fileUrl, '_blank')}
                          className="w-full"
                        >
                          📎 Скачать файл задания
                        </Button>
                        <p className="text-xs text-gray-500">
                          Файл: {assignment.fileUrl.split('/').pop()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        Файл задания не прикреплен
                      </p>
                    )}

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">Загрузить решение</h4>
                      
                      {/* Показываем уже загруженное решение */}
                      {submissions[assignment.id] && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-800 font-medium">✅ Решение загружено</p>
                              <p className="text-blue-600 text-sm">
                                Файл: {submissions[assignment.id].fileUrl.split('/').pop()}
                              </p>
                              <p className="text-blue-500 text-xs">
                                Загружено: {new Date(submissions[assignment.id].submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(submissions[assignment.id].fileUrl, '_blank')}
                            >
                              📎 Скачать
                            </Button>
                          </div>
                          
                          {/* Показываем оценку и комментарий */}
                          {submissionDetails[assignment.id] && submissionDetails[assignment.id].grade !== null && submissionDetails[assignment.id].grade !== undefined && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium">Оценка:</span>
                                <Badge 
                                  variant={submissionDetails[assignment.id].grade >= 3 ? 'default' : 'destructive'}
                                  className="text-xs"
                                >
                                  {submissionDetails[assignment.id].grade} {submissionDetails[assignment.id].grade === 1 ? 'балл' : submissionDetails[assignment.id].grade < 5 ? 'балла' : 'баллов'}
                                </Badge>
                              </div>
                              {submissionDetails[assignment.id].feedback && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-gray-700 mb-1">Комментарий преподавателя:</p>
                                  <div className="bg-white border border-gray-200 rounded p-2 text-sm text-gray-600">
                                    {submissionDetails[assignment.id].feedback}
                                  </div>
                                </div>
                              )}
                              {submissionDetails[assignment.id].gradedAt && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Проверено: {new Date(submissionDetails[assignment.id].gradedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {uploadError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <p className="text-red-700 text-sm">{uploadError}</p>
                        </div>
                      )}
                      
                      {uploadSuccess && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <p className="text-green-700 text-sm">{uploadSuccess}</p>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          <input
                            id="file-input"
                            type="file"
                            onChange={handleFileChange}
                            accept=".xlsx,.xls,.pdf,.zip,.doc,.docx"
                            className="hidden"
                          />
                          <div className="text-center">
                            <p className="text-gray-500 mb-2">
                              {selectedFile ? `Выбран файл: ${selectedFile.name}` : 'Перетащите файл сюда или нажмите для выбора'}
                            </p>
                            <p className="text-xs text-gray-400 mb-3">
                              Поддерживаются: .xlsx, .xls, .pdf, .zip, .doc, .docx (до 50 МБ)
                            </p>
                            <Button 
                              variant="outline" 
                              onClick={() => document.getElementById('file-input')?.click()}
                              className="mb-2"
                            >
                              {selectedFile ? 'Изменить файл' : 'Выбрать файл'}
                            </Button>
                          </div>
                        </div>
                        
                        {selectedFile && (
                          <Button 
                            onClick={() => handleUploadSubmission(assignment.id)}
                            disabled={uploading}
                            className="w-full"
                          >
                            {uploading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Загрузка...
                              </>
                            ) : (
                              '📤 Загрузить решение'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}