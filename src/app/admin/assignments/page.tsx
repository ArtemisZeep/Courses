'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import RichTextEditor from '@/components/ui/rich-text-editor'

interface Assignment {
  id: string
  title: string
  description: string
  fileUrl?: string
  moduleId: string
  module: {
    title: string
  }
  _count: {
    submissions: number
  }
}

interface Module {
  id: string
  title: string
  order: number
}

export default function AssignmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    moduleId: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.isAdmin) {
      router.push('/dashboard')
    } else {
      fetchAssignments()
      fetchModules()
    }
  }, [session, status, router])

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/admin/assignments')
      const data = await response.json()

      if (response.ok) {
        setAssignments(data.assignments)
      } else {
        setError(data.error || 'Ошибка при загрузке заданий')
      }
    } catch (error) {
      setError('Ошибка при загрузке заданий')
    } finally {
      setLoading(false)
    }
  }

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
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('Файл слишком большой (максимум 50MB)')
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (!formData.title || !formData.description || !formData.moduleId) {
      setError('Заполните все обязательные поля')
      setSaving(false)
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('moduleId', formData.moduleId)
      
      if (selectedFile) {
        formDataToSend.append('file', selectedFile)
      }

      const url = editingAssignment 
        ? `/api/admin/assignments/${editingAssignment.id}`
        : '/api/admin/assignments'
      
      const method = editingAssignment ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      })

      const data = await response.json()

      if (response.ok) {
        const message = editingAssignment 
          ? 'Задание успешно обновлено' 
          : 'Задание успешно создано'
        
        setSuccess(message)
        setShowForm(false)
        setEditingAssignment(null)
        setFormData({
          title: '',
          description: '',
          moduleId: ''
        })
        setSelectedFile(null)
        // Сброс input файла
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        fetchAssignments()
      } else {
        const errorMessage = editingAssignment 
          ? 'Ошибка при обновлении задания'
          : 'Ошибка при создании задания'
        setError(data.error || errorMessage)
      }
    } catch (error) {
      const errorMessage = editingAssignment 
        ? 'Ошибка при обновлении задания'
        : 'Ошибка при создании задания'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const startEditing = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/admin/assignments/${assignmentId}`)
      const data = await response.json()

      if (response.ok) {
        const assignment = data.assignment
        setEditingAssignment(assignment)
        setFormData({
          title: assignment.title,
          description: assignment.description,
          moduleId: assignment.moduleId
        })
        setSelectedFile(null)
        setShowForm(true)
        setError('')
      } else {
        setError(data.error || 'Ошибка при загрузке задания')
      }
    } catch (error) {
      setError('Ошибка при загрузке задания')
    }
  }

  const cancelEditing = () => {
    setEditingAssignment(null)
    setFormData({
      title: '',
      description: '',
      moduleId: ''
    })
    setSelectedFile(null)
    setShowForm(false)
    setError('')
    setSuccess('')
  }

  const deleteAssignment = async (assignmentId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это задание?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/assignments/${assignmentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAssignments(assignments.filter(a => a.id !== assignmentId))
        alert('Задание успешно удалено')
      } else {
        const data = await response.json()
        alert(data.error || 'Ошибка при удалении задания')
      }
    } catch (error) {
      alert('Ошибка при удалении задания')
    }
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
                Управление заданиями
              </h1>
              <p className="text-gray-600">Создание и управление практическими заданиями</p>
            </div>
                <Button
              variant="outline"
              onClick={() => {
                    console.log('[Admin/Assignments] Logout clicked. Navigating to /auth/signout')
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

        {/* Quick Actions */}
        <div className="mb-6">
          <Button onClick={() => {
            if (editingAssignment) {
              cancelEditing()
            } else {
              setShowForm(!showForm)
            }
          }}>
            {showForm ? 'Отменить' : '+ Создать задание'}
          </Button>
        </div>

        {/* Create/Edit Assignment Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingAssignment ? 'Редактировать задание' : 'Создать новое задание'}
              </CardTitle>
              <CardDescription>
                {editingAssignment 
                  ? 'Измените данные задания'
                  : 'Добавьте практическое задание для студентов'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название задания *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Введите название задания"
                      required
                    />
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание задания *</Label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    placeholder="Подробное описание задания, требования, критерии оценки..."
                    className="min-h-[300px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Файл задания (опционально)</Label>
                  <Input
                    id="file-input"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                  />
                  <p className="text-sm text-gray-500">
                    Поддерживаемые форматы: PDF, DOC, DOCX, XLS, XLSX, ZIP, RAR. Максимум 50MB.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={saving}>
                    {saving 
                      ? (editingAssignment ? 'Обновление...' : 'Создание...') 
                      : (editingAssignment ? 'Обновить задание' : 'Создать задание')
                    }
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      if (editingAssignment) {
                        cancelEditing()
                      } else {
                        setShowForm(false)
                      }
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Assignments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Задания</CardTitle>
            <CardDescription>
              Список всех практических заданий
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Пока нет созданных заданий</p>
                <Button onClick={() => setShowForm(true)}>
                  Создать первое задание
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Модуль</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Файл</TableHead>
                    <TableHead>Отправлений</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="font-medium">{assignment.title}</div>
                      </TableCell>
                      <TableCell>{assignment.module.title}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div 
                            className="text-sm text-gray-600 line-clamp-3"
                            dangerouslySetInnerHTML={{ 
                              __html: assignment.description.length > 200 
                                ? assignment.description.substring(0, 200) + '...' 
                                : assignment.description 
                            }}
                          />
                          {assignment.description.length > 200 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs p-0 h-auto mt-1"
                              onClick={() => {
                                const modal = document.createElement('div')
                                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
                                modal.innerHTML = `
                                  <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                                    <div class="flex justify-between items-center mb-4">
                                      <h3 class="text-lg font-semibold">Описание задания</h3>
                                      <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                                        ✕
                                      </button>
                                    </div>
                                    <div class="prose prose-sm max-w-none">
                                      ${assignment.description}
                                    </div>
                                  </div>
                                `
                                document.body.appendChild(modal)
                                modal.addEventListener('click', (e) => {
                                  if (e.target === modal) modal.remove()
                                })
                              }}
                            >
                              Показать полностью
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {assignment.fileUrl ? (
                          <a
                            href={assignment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Скачать
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">Нет файла</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {assignment._count.submissions}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(assignment.id)}
                          >
                            Редактировать
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteAssignment(assignment.id)}
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