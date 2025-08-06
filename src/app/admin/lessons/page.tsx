'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import GoogleDocInstructions from '@/components/google-doc-instructions'

interface Module {
  id: string
  title: string
  order: number
}

interface Lesson {
  id: string
  title: string
  contentHtml?: string
  googleDocUrl?: string
  order: number
  moduleId: string
}

export default function LessonsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [modules, setModules] = useState<Module[]>([])
  const [selectedModule, setSelectedModule] = useState('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Форма создания урока
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    contentHtml: '',
    googleDocUrl: '',
    order: '',
    moduleId: ''
  })

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
        setModules(data.modules)
      } else {
        setError(data.error || 'Ошибка при загрузке модулей')
      }
    } catch (error) {
      setError('Ошибка при загрузке модулей')
    } finally {
      setLoading(false)
    }
  }

  const fetchLessons = async (moduleId: string) => {
    try {
      const response = await fetch(`/api/admin/lessons?moduleId=${moduleId}`)
      const data = await response.json()

      if (response.ok) {
        setLessons(data.lessons)
      } else {
        setError(data.error || 'Ошибка при загрузке уроков')
      }
    } catch (error) {
      setError('Ошибка при загрузке уроков')
    }
  }

  const handleModuleChange = (moduleId: string) => {
    setSelectedModule(moduleId)
    if (moduleId) {
      fetchLessons(moduleId)
    } else {
      setLessons([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!formData.moduleId || !formData.title || !formData.order) {
      setError('Заполните все обязательные поля')
      setIsLoading(false)
      return
    }

    if (!formData.contentHtml && !formData.googleDocUrl) {
      setError('Необходимо указать либо HTML контент, либо ссылку на Google Doc')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          contentHtml: formData.contentHtml || undefined,
          googleDocUrl: formData.googleDocUrl || undefined,
          order: parseInt(formData.order),
          moduleId: formData.moduleId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Урок успешно создан!')
        setFormData({
          title: '',
          contentHtml: '',
          googleDocUrl: '',
          order: '',
          moduleId: ''
        })
        setShowForm(false)
        // Обновляем список уроков
        if (selectedModule) {
          fetchLessons(selectedModule)
        }
      } else {
        setError(data.error || 'Ошибка при создании урока')
      }
    } catch (error) {
      setError('Ошибка при создании урока')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || !session?.user?.isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>
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
                Управление уроками
              </h1>
              <p className="text-gray-600">Создавайте и редактируйте уроки для модулей</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Отменить' : '+ Создать урок'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Выбор модуля */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Выберите модуль</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedModule} onValueChange={handleModuleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите модуль для просмотра уроков" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.order}. {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Инструкции по Google Docs */}
        {showForm && <GoogleDocInstructions />}

        {/* Форма создания урока */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Создать новый урок</CardTitle>
              <CardDescription>
                Заполните информацию о новом уроке. Укажите либо HTML контент, либо ссылку на Google Doc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название урока *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Введите название урока"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order">Порядковый номер *</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                      placeholder="1"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="moduleId">Модуль *</Label>
                  <Select value={formData.moduleId} onValueChange={(value) => setFormData({ ...formData, moduleId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите модуль" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.order}. {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="googleDocUrl">Ссылка на Google Doc</Label>
                  <Input
                    id="googleDocUrl"
                    type="url"
                    value={formData.googleDocUrl}
                    onChange={(e) => setFormData({ ...formData, googleDocUrl: e.target.value })}
                    placeholder="https://docs.google.com/document/d/..."
                  />
                  <p className="text-xs text-gray-500">
                    Укажите ссылку на Google Doc для встраивания документа в урок
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentHtml">HTML контент</Label>
                  <Textarea
                    id="contentHtml"
                    value={formData.contentHtml}
                    onChange={(e) => setFormData({ ...formData, contentHtml: e.target.value })}
                    placeholder="<p>Содержание урока в HTML формате...</p>"
                    rows={6}
                  />
                  <p className="text-xs text-gray-500">
                    Укажите HTML контент урока. Используйте только если не указана ссылка на Google Doc.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-green-700">{success}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Создание...' : 'Создать урок'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Список уроков */}
        {selectedModule && (
          <Card>
            <CardHeader>
              <CardTitle>Уроки модуля</CardTitle>
              <CardDescription>
                {lessons.length} уроков в модуле
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lessons.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  В этом модуле пока нет уроков
                </p>
              ) : (
                <div className="space-y-4">
                  {lessons.map((lesson) => (
                    <div key={lesson.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{lesson.title}</h3>
                          <p className="text-sm text-gray-600">
                            Порядок: {lesson.order}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {lesson.googleDocUrl && (
                            <Badge variant="secondary">Google Doc</Badge>
                          )}
                          {lesson.contentHtml && (
                            <Badge variant="outline">HTML</Badge>
                          )}
                        </div>
                      </div>
                      {lesson.googleDocUrl && (
                        <p className="text-sm text-blue-600 mt-2">
                          📄 {lesson.googleDocUrl}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
} 