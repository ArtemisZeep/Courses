'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Module {
  id: string
  title: string
  description: string
  order: number
  isActive: boolean
  createdAt: string
  _count: {
    lessons: number
    questions: number
  }
}

export default function AdminPage() {
  const { data: session } = useSession()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchModules()
  }, [])

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/admin/modules')
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

  const deleteModule = async (moduleId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот модуль? Это действие нельзя отменить.')) {
      return
    }

    try {
      const response = await fetch(`/api/modules/${moduleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setModules(modules.filter(m => m.id !== moduleId))
        alert('Модуль успешно удален')
      } else {
        const data = await response.json()
        alert(data.error || 'Ошибка при удалении модуля')
      }
    } catch (error) {
      alert('Ошибка при удалении модуля')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU')
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
              <h1 className="text-3xl font-bold text-gray-900">
                Панель администратора
              </h1>
              <p className="text-gray-600">Управление курсами и контентом</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">К курсам</Button>
              </Link>
            <Button
                variant="outline"
                onClick={() => {
                console.log('[Admin] Logout clicked. Navigating to /auth/signout')
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium">Активных модулей</CardTitle>
              <Badge className="bg-green-100 text-green-800">
                {modules.filter(m => m.isActive).length}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {modules.filter(m => m.isActive).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего уроков</CardTitle>
              <Badge variant="outline">
                {modules.reduce((total, m) => total + m._count.lessons, 0)}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {modules.reduce((total, m) => total + m._count.lessons, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего вопросов</CardTitle>
              <Badge variant="outline">
                {modules.reduce((total, m) => total + m._count.questions, 0)}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {modules.reduce((total, m) => total + m._count.questions, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                📝 Создать модуль
              </CardTitle>
              <CardDescription>
                Добавить новый модуль курса
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/modules/create">
                <Button className="w-full">Создать</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                📚 Управление уроками
              </CardTitle>
              <CardDescription>
                Создавать и редактировать уроки с Google Docs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/lessons">
                <Button className="w-full" variant="outline">
                  Управлять уроками
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                📋 Проверка заданий
              </CardTitle>
              <CardDescription>
                Просмотр отправленных решений
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/submissions">
                <Button className="w-full" variant="outline">
                  Проверить
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                📝 Управление заданиями
              </CardTitle>
              <CardDescription>
                Создание и редактирование заданий
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/assignments">
                <Button className="w-full" variant="outline">
                  Управлять
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                📊 Массовая загрузка вопросов
              </CardTitle>
              <CardDescription>
                Загрузить множество вопросов через JSON
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/questions/bulk">
                <Button className="w-full" variant="outline">
                  Загрузить
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Modules Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Управление модулями</CardTitle>
                <CardDescription>
                  Список всех модулей курса с возможностью редактирования
                </CardDescription>
              </div>
              <Link href="/admin/modules/create">
                <Button>+ Создать модуль</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Пока нет созданных модулей</p>
                <Link href="/admin/modules/create">
                  <Button>Создать первый модуль</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Порядок</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Уроки</TableHead>
                    <TableHead>Вопросы</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Создан</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules
                    .sort((a, b) => a.order - b.order)
                    .map((module) => (
                      <TableRow 
                        key={module.id}
                        className={!module.isActive ? 'opacity-60 bg-gray-50' : ''}
                      >
                        <TableCell className="font-medium">
                          {module.order}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{module.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {module.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {module._count.lessons}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {module._count.questions}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={module.isActive ? 'default' : 'secondary'}
                            className={module.isActive ? 'bg-green-100 text-green-800' : ''}
                          >
                            {module.isActive ? 'Активен' : 'Неактивен'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(module.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Link href={`/admin/modules/${module.id}`}>
                              <Button size="sm" variant="outline">
                                Редактировать
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => deleteModule(module.id)}
                            >
                              Удалить
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
      </main>
    </div>
  )
}