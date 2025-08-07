'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowLeft } from 'lucide-react'

interface QuizSuccessProps {
  moduleId: string
  onReturnToModule: () => void
}

export default function QuizSuccess({ moduleId, onReturnToModule }: QuizSuccessProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            🎉 Тест успешно отправлен!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-gray-600">
            <p className="mb-2">Ваши ответы сохранены и обработаны.</p>
            <p>Результаты будут отображены после обновления страницы.</p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={onReturnToModule}
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться к модулю
            </Button>
            
            <p className="text-sm text-gray-500">
              Страница автоматически обновится через несколько секунд
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
