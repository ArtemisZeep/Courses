'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface Module {
  id: string
  title: string
  description: string
}

export default function BulkQuestionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [modules, setModules] = useState<Module[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [jsonData, setJsonData] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewData, setPreviewData] = useState<any>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.isAdmin) {
      router.push('/dashboard')
    } else {
      fetchModules()
    }
  }, [session, status, router])

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/modules')
      const data = await response.json()

      if (response.ok) {
        setModules(data.modules || [])
      } else {
        setError(data.error || 'Ошибка при загрузке модулей')
      }
    } catch (error) {
      setError('Ошибка при загрузке модулей')
    }
  }

  const validateJson = () => {
    try {
      if (!jsonData.trim()) {
        setError('Введите JSON данные')
        return false
      }

      const parsed = JSON.parse(jsonData)
      
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        setError('JSON должен содержать массив "questions"')
        return false
      }

      if (parsed.questions.length === 0) {
        setError('Массив вопросов не может быть пустым')
        return false
      }

      // Проверяем каждый вопрос
      for (let i = 0; i < parsed.questions.length; i++) {
        const question = parsed.questions[i]
        
        if (!question.title) {
          setError(`Вопрос ${i + 1}: отсутствует title`)
          return false
        }

        if (!question.type || (question.type !== 'single' && question.type !== 'multiple')) {
          setError(`Вопрос ${i + 1}: неверный тип (должен быть "single" или "multiple")`)
          return false
        }

        if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
          setError(`Вопрос ${i + 1}: отсутствуют варианты ответов`)
          return false
        }

        // Проверяем варианты ответов
        const correctOptions = question.options.filter((opt: any) => opt.isCorrect)
        if (correctOptions.length === 0) {
          setError(`Вопрос ${i + 1}: должен быть хотя бы один правильный ответ`)
          return false
        }

        for (let j = 0; j < question.options.length; j++) {
          const option = question.options[j]
          if (!option.text) {
            setError(`Вопрос ${i + 1}, вариант ${j + 1}: отсутствует текст`)
            return false
          }
        }
      }

      setPreviewData(parsed)
      setError('')
      return true
    } catch (error) {
      setError('Неверный формат JSON')
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedModuleId) {
      setError('Выберите модуль')
      return
    }

    if (!validateJson()) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const parsed = JSON.parse(jsonData)
      const requestData = {
        moduleId: selectedModuleId,
        questions: parsed.questions
      }

      const response = await fetch('/api/admin/questions/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setJsonData('')
        setPreviewData(null)
      } else {
        setError(data.error || 'Ошибка при загрузке вопросов')
      }
    } catch (error) {
      setError('Ошибка при отправке данных')
    } finally {
      setLoading(false)
    }
  }

  const loadExample = () => {
    const example = {
      "questions": [
        {
          "title": "Что такое Excel?",
          "description": "Выберите правильное определение",
          "type": "single",
          "order": 1,
          "options": [
            {
              "text": "Текстовый редактор",
              "isCorrect": false,
              "order": 1
            },
            {
              "text": "Электронная таблица",
              "isCorrect": true,
              "order": 2
            },
            {
              "text": "Графический редактор",
              "isCorrect": false,
              "order": 3
            },
            {
              "text": "База данных",
              "isCorrect": false,
              "order": 4
            }
          ]
        },
        {
          "title": "Какие функции доступны в Excel?",
          "description": "Выберите все правильные ответы",
          "type": "multiple",
          "order": 2,
          "options": [
            {
              "text": "Создание таблиц",
              "isCorrect": true,
              "order": 1
            },
            {
              "text": "Построение графиков",
              "isCorrect": true,
              "order": 2
            },
            {
              "text": "Редактирование видео",
              "isCorrect": false,
              "order": 3
            },
            {
              "text": "Выполнение расчетов",
              "isCorrect": true,
              "order": 4
            }
          ]
        }
      ]
    }
    
    setJsonData(JSON.stringify(example, null, 2))
    setPreviewData(example)
    setError('')
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
                Массовая загрузка вопросов
              </h1>
              <p className="text-gray-600">Загрузите множество вопросов через JSON</p>
            </div>
                <Button
              variant="outline"
              onClick={() => {
                    console.log('[Admin/Questions] Logout clicked. Navigating to /auth/signout')
                    window.location.href = '/auth/signout'
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

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle>Загрузка вопросов</CardTitle>
              <CardDescription>
                Вставьте JSON с вопросами и выберите модуль
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="module">Модуль</Label>
                  <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите модуль" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="json">JSON данные</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={loadExample}
                    >
                      Загрузить пример
                    </Button>
                  </div>
                  <Textarea
                    id="json"
                    value={jsonData}
                    onChange={(e) => setJsonData(e.target.value)}
                    placeholder="Вставьте JSON с вопросами..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Загрузка...' : 'Загрузить вопросы'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setJsonData('')
                      setPreviewData(null)
                      setError('')
                      setSuccess('')
                    }}
                  >
                    Очистить
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Предварительный просмотр</CardTitle>
              <CardDescription>
                Проверьте, как будут выглядеть ваши вопросы
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {previewData.questions.length} вопросов
                    </Badge>
                    <Badge variant="outline">
                      {previewData.questions.filter((q: any) => q.type === 'single').length} одиночных
                    </Badge>
                    <Badge variant="outline">
                      {previewData.questions.filter((q: any) => q.type === 'multiple').length} множественных
                    </Badge>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {previewData.questions.map((question: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={question.type === 'single' ? 'default' : 'secondary'}>
                            {question.type === 'single' ? 'Один ответ' : 'Несколько ответов'}
                          </Badge>
                          <span className="text-sm text-gray-500">#{index + 1}</span>
                        </div>
                        <h4 className="font-medium text-sm">{question.title}</h4>
                        {question.description && (
                          <p className="text-xs text-gray-600 mt-1">{question.description}</p>
                        )}
                        <div className="mt-2 space-y-1">
                          {question.options.map((option: any, optIndex: number) => (
                            <div key={optIndex} className="flex items-center gap-2 text-xs">
                              <span className={option.isCorrect ? 'text-green-600' : 'text-gray-500'}>
                                {option.isCorrect ? '✓' : '○'}
                              </span>
                              <span className={option.isCorrect ? 'font-medium' : ''}>
                                {option.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Введите JSON данные для предварительного просмотра</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Format Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Формат JSON</CardTitle>
            <CardDescription>
              Структура данных для загрузки вопросов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Общая структура:</h4>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{
  "questions": [
    {
      "title": "Текст вопроса",
      "description": "Описание (необязательно)",
      "type": "single" | "multiple",
      "order": 1,
      "options": [
        {
          "text": "Вариант ответа",
          "isCorrect": true | false,
          "order": 1
        }
      ]
    }
  ]
}`}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Поля вопроса:</h4>
                  <ul className="text-sm space-y-1">
                    <li><strong>title</strong> - текст вопроса (обязательно)</li>
                    <li><strong>description</strong> - описание (необязательно)</li>
                    <li><strong>type</strong> - "single" или "multiple" (обязательно)</li>
                    <li><strong>order</strong> - порядок вопроса (обязательно)</li>
                    <li><strong>options</strong> - массив вариантов ответов (обязательно)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Поля варианта ответа:</h4>
                  <ul className="text-sm space-y-1">
                    <li><strong>text</strong> - текст варианта (обязательно)</li>
                    <li><strong>isCorrect</strong> - правильный ли ответ (обязательно)</li>
                    <li><strong>order</strong> - порядок варианта (обязательно)</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Важные правила:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Должен быть хотя бы один правильный ответ в каждом вопросе</li>
                  <li>• Для вопросов типа "single" должен быть только один правильный ответ</li>
                  <li>• Для вопросов типа "multiple" может быть несколько правильных ответов</li>
                  <li>• Порядок вопросов и вариантов должен быть уникальным</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 