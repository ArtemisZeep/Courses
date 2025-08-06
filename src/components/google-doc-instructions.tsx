'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export default function GoogleDocInstructions() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          Настройка доступа к Google Docs
        </CardTitle>
        <CardDescription>
          Для корректного отображения Google Docs в уроках необходимо настроить доступ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Важно:</strong> Google Doc должен быть доступен для просмотра всем, у кого есть ссылка.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2 text-sm">
            <h4 className="font-semibold">Как настроить доступ:</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Откройте Google Doc в браузере</li>
              <li>Нажмите кнопку "Настройки доступа" (справа вверху)</li>
              <li>Выберите "Доступно всем, у кого есть ссылка"</li>
              <li>Убедитесь, что выбрано "Может просматривать"</li>
              <li>Нажмите "Готово"</li>
            </ol>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Альтернативный способ:</strong></p>
            <p>Можно использовать публикацию документа в интернете:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>В Google Doc выберите "Файл" → "Поделиться" → "Опубликовать в интернете"</li>
              <li>Нажмите "Опубликовать"</li>
              <li>Скопируйте ссылку и используйте её в уроке</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 