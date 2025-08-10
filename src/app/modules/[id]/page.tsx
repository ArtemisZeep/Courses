'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import GoogleDocViewer from '@/components/google-doc-viewer'
import Quiz from '@/components/quiz'
import QuizSuccess from '@/components/quiz-success'

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
  const [showQuizSuccess, setShowQuizSuccess] = useState(false)

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

  const handleReturnToModule = () => {
    setShowQuizSuccess(false)
    setQuizSubmitted(false)
    setQuizResult(null)
    setSelectedAnswers({})
    setError('')
    setActiveTab('lessons') // Переключаемся на вкладку уроков
    // Обновляем данные модуля
    fetchModule()
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

      let data
      try {
        data = await response.json()
        console.log('Ответ сервера:', data)
      } catch (jsonError) {
        console.error('Ошибка при парсинге JSON:', jsonError)
        throw new Error('Ошибка при обработке ответа сервера')
      }

      if (response.ok) {
        // Проверяем, что ответ содержит необходимые данные
        if (!data || typeof data !== 'object') {
          throw new Error('Некорректный ответ сервера')
        }

        setQuizResult(data)
        setQuizSubmitted(true)
        
        // Показываем страницу успешной отправки
        setShowQuizSuccess(true)
        
        // Автоматически перезагружаем страницу через 5 секунд
        setTimeout(() => {
          window.location.reload()
        }, 2000)
        
      } else {
        const errorMessage = data.details ? 
          `${data.error}\nДетали: ${data.details}` : 
          data.error || 'Ошибка при отправке теста'
        setError(errorMessage)
        console.error('Ошибка API:', response.status, data)
      }
    } catch (error) {
      console.error('Ошибка при отправке теста:', error)
      
      // Проверяем тип ошибки для более точного сообщения
      if (error instanceof Error) {
        setError(error.message)
      } else if (typeof error === 'string') {
        setError(error)
      } else {
        setError('Произошла неожиданная ошибка. Попробуйте еще раз.')
      }
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
      <div className={styles.centerScreen}>
        <div className={styles.textCenter}>
          <div className={styles.spinnerLg}></div>
          <p className={styles.muted}>Загрузка модуля...</p>
        </div>
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className={styles.centerScreen}>
        <div className={styles.textCenter}>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка</h1>
          <p className="text-gray-600 mb-4">{error || 'Модуль не найден'}</p>
          <Link href="/dashboard" className={styles.backLink}>Вернуться к курсам</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerBar}>
            <div>
              <Link href="/dashboard" className={styles.backLink}>
                ← Вернуться к курсам
              </Link>
              <h1 className={styles.moduleTitle}>
                {module.title}
              </h1>
              <p className={styles.moduleDesc}>{module.description}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="lessons">📚 Уроки ({module.lessons.length})</TabsTrigger>
            <TabsTrigger value="quiz">🧪 Тест ({module.questions.length})</TabsTrigger>
            <TabsTrigger value="assignment">💼 Задание</TabsTrigger>
          </TabsList>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className={styles.tabContent}>
            {module.lessons.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className={styles.emptyText}>В этом модуле пока нет уроков</p>
                </CardContent>
              </Card>
            ) : (
              module.lessons.map((lesson) => (
                <Card key={lesson.id}>
                  <CardHeader>
                    <CardTitle className={styles.cardTitleRow}>
                      {lesson.title}
                      {readLessons.includes(lesson.id) ? (
                        <Badge variant="outline" className={styles.badgeSuccessOutline}>
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
                        className={styles.proseNoLimit}
                        dangerouslySetInnerHTML={{ __html: lesson.contentHtml }}
                      />
                    ) : (
                      <p className={styles.emptyText}>Контент урока не найден</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz" className={styles.tabContent}>
            {showQuizSuccess ? (
              <QuizSuccess
                moduleId={moduleId}
                onReturnToModule={handleReturnToModule}
              />
            ) : (
              <>
                {error && (
                  <Card className={styles.errorCard}>
                    <CardContent className={styles.pt6}>
                      <div className={styles.errorRow}>
                        <span className={styles.errorIcon}>❌</span>
                        <div>
                          <h4 className={styles.errorTitle}>Ошибка</h4>
                          <pre className={styles.errorPre}>{error}</pre>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className={styles.mt3} onClick={() => setError('')}>
                        Закрыть
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                {module.questions.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className={styles.emptyText}>В этом модуле пока нет вопросов</p>
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
              </>
            )}
          </TabsContent>

          {/* Assignment Tab */}
          <TabsContent value="assignment" className={styles.tabContent}>
            {module.assignments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className={styles.emptyText}>В этом модуле пока нет заданий</p>
                </CardContent>
              </Card>
            ) : (
              module.assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <CardTitle className={styles.cardTitleRow}>
                      {assignment.title}
                      <Badge variant="outline" className={styles.assignmentMeta}>
                        Новое
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      <div 
                        className={styles.proseSmNoLimit}
                        dangerouslySetInnerHTML={{ __html: assignment.description }}
                      />
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {assignment.fileUrl ? (
                      <div className="space-y-3">
                        <Button 
                          onClick={() => window.open(assignment.fileUrl, '_blank')}
                          className={styles.btnFull}
                        >
                          📎 Скачать файл задания
                        </Button>
                        <p className={styles.infoNote}>
                          Файл: {assignment.fileUrl.split('/').pop()}
                        </p>
                      </div>
                    ) : (
                      <p className={styles.centerNote}>
                        Файл задания не прикреплен
                      </p>
                    )}

                    <div className={styles.sectionBorderTop}>
                      <h4 className={styles.sectionTitle}>Загрузить решение</h4>
                      
                      {/* Показываем уже загруженное решение */}
                      {submissions[assignment.id] && (
                        <div className={styles.uploadInfoBox}>
                          <div className={styles.rowBetween}>
                            <div>
                              <p className={styles.textBlueStrong}>✅ Решение загружено</p>
                              <p className={styles.textBlue}>
                                Файл: {submissions[assignment.id].fileUrl.split('/').pop()}
                              </p>
                              <p className={styles.textBlueLight}>
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
                          {submissionDetails[assignment.id] && (
                            <div className={styles.gradeBlock}>
                              {submissionDetails[assignment.id].grade !== null && submissionDetails[assignment.id].grade !== undefined && (
                                <div className={styles.gradeRow}>
                                  <span className={styles.gradeLabel}>Оценка:</span>
                                  <Badge 
                                    variant={submissionDetails[assignment.id].grade >= 3 ? 'default' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {submissionDetails[assignment.id].grade}/5 баллов
                                  </Badge>
                                </div>
                              )}
                              {submissionDetails[assignment.id].feedback && (
                                <div className="mt-2">
                                  <p className={styles.teacherLabel}>Комментарий преподавателя:</p>
                                  <div className={styles.teacherBox}>
                                    {submissionDetails[assignment.id].feedback}
                                  </div>
                                </div>
                              )}
                              {submissionDetails[assignment.id].gradedAt && (
                                <p className={styles.teacherNote}>
                                  Проверено: {new Date(submissionDetails[assignment.id].gradedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {uploadError && (
                        <div className={styles.errorBox}>
                          <p className="text-red-700 text-sm">{uploadError}</p>
                        </div>
                      )}
                      
                      {uploadSuccess && (
                        <div className={styles.successBox}>
                          <p className="text-green-700 text-sm">{uploadSuccess}</p>
                        </div>
                      )}
                      
                      <div className={styles.uploader}>
                        <div className={styles.dropzone}>
                          <input
                            id="file-input"
                            type="file"
                            onChange={handleFileChange}
                            accept=".xlsx,.xls,.pdf,.zip,.doc,.docx"
                            className={styles.hiddenInput}
                          />
                          <div className={styles.uploadCenter}>
                            <p className={styles.uploadHelp}>
                              {selectedFile ? `Выбран файл: ${selectedFile.name}` : 'Перетащите файл сюда или нажмите для выбора'}
                            </p>
                            <p className={styles.uploadHint}>
                              Поддерживаются: .xlsx, .xls, .pdf, .zip, .doc, .docx (до 50 МБ)
                            </p>
                            <Button 
                              variant="outline" 
                              onClick={() => document.getElementById('file-input')?.click()}
                              className={styles.mb2}
                            >
                              {selectedFile ? 'Изменить файл' : 'Выбрать файл'}
                            </Button>
                          </div>
                        </div>
                        
                        {selectedFile && (
                          <Button 
                            onClick={() => handleUploadSubmission(assignment.id)}
                            disabled={uploading}
                            className={styles.btnFull}
                          >
                            {uploading ? (
                              <>
                                <div className={styles.spinnerSm}></div>
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