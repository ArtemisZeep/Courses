'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface GoogleDocsViewerProps {
  url: string
  title?: string
  description?: string
}

export function GoogleDocsViewer({ url, title = "Учебные материалы", description = "Изучите материалы модуля в Google Docs" }: GoogleDocsViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Преобразуем URL для предварительного просмотра
  const previewUrl = url.replace('/edit', '/preview')

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[600px] border rounded-lg overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Загрузка документа...</p>
              </div>
            </div>
          )}
          
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <p className="text-red-600 mb-4">Ошибка загрузки документа</p>
                <Button 
                  onClick={() => window.open(url, '_blank')}
                  variant="outline"
                >
                  🔗 Открыть в новой вкладке
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              src={previewUrl}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
              onLoad={handleLoad}
              onError={handleError}
            />
          )}
        </div>
        
        <div className="mt-4 text-center">
          <Button 
            onClick={() => window.open(url, '_blank')}
            variant="outline"
          >
            🔗 Открыть в новой вкладке
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 