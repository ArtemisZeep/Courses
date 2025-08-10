'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

interface Module {
  id: string
  title: string
  description: string
  order: number
  isActive: boolean
  createdAt: string
}

export default function EditModulePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const moduleId = params.id as string

  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 1,
    isActive: true
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.isAdmin) {
      router.push('/dashboard')
    } else {
      fetchModule()
    }
  }, [session, status, router, moduleId])

  const fetchModule = async () => {
    try {
      const response = await fetch(`/api/admin/modules/${moduleId}`)
      const data = await response.json()

      if (response.ok) {
        setModule(data.module)
        setFormData({
          title: data.module.title,
          description: data.module.description,
          order: data.module.order,
          isActive: data.module.isActive
        })
      } else {
        setError(data.error || 'Ошибка при загрузке модуля')
      }
    } catch (error) {
      setError('Ошибка при загрузке модуля')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (!formData.title || !formData.description) {
      setError('Заполните все обязательные поля')
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Модуль успешно обновлен')
        setModule(data.module)
      } else {
        setError(data.error || 'Ошибка при обновлении модуля')
      }
    } catch (error) {
      setError('Ошибка при обновлении модуля')
    } finally {
      setSaving(false)
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

  if (error && !module) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/admin">
            <Button>Вернуться к админ панели</Button>
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
              <Link href="/admin" className="text-blue-600 hover:underline text-sm">
                ← Вернуться к админ панели
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">
                Редактировать модуль
              </h1>
              <p className="text-gray-600">Измените данные модуля курса</p>
            </div>
              <Button
              variant="outline"
              onClick={() => {
                  console.log('[Admin/Module] Logout clicked. Navigating to /auth/signout')
                  window.location.href = '/auth/signout'
              }}
            >
              Выход
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <Card>
          <CardHeader>
            <CardTitle>Данные модуля</CardTitle>
            <CardDescription>
              Измените название, описание и настройки модуля
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Название модуля *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Введите название модуля"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">Порядок *</Label>
                  <Input
                    id="order"
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    placeholder="Порядок модуля"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание модуля *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Подробное описание модуля..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Модуль активен</Label>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
                <Link href="/admin">
                  <Button type="button" variant="outline">
                    Отмена
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Module Info */}
        {module && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Информация о модуле</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">ID модуля</Label>
                  <p className="text-sm">{module.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Дата создания</Label>
                  <p className="text-sm">{new Date(module.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Статус</Label>
                  <p className="text-sm">{module.isActive ? 'Активен' : 'Неактивен'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
} 