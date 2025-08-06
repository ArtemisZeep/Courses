'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2, ExternalLink } from 'lucide-react'

interface GoogleDocViewerProps {
  url: string
  title: string
}

export default function GoogleDocViewer({ url, title }: GoogleDocViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Преобразуем обычную ссылку Google Doc в ссылку для встраивания
  const getEmbedUrl = (originalUrl: string) => {
    // Если это уже ссылка для встраивания
    if (originalUrl.includes('/embed')) {
      return originalUrl
    }

    // Преобразуем обычную ссылку в ссылку для встраивания
    const docId = originalUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
    if (docId) {
      return `https://docs.google.com/document/d/${docId}/preview`
    }

    // Если не удалось извлечь ID, возвращаем оригинальную ссылку
    return originalUrl
  }

  const embedUrl = getEmbedUrl(url)

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Обработка клавиши Escape для выхода из полноэкранного режима
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown)
      // Блокируем прокрутку страницы
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Восстанавливаем прокрутку страницы
      document.body.style.overflow = 'unset'
    }
  }, [isFullscreen])

  return (
    <div className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {!isFullscreen && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">
            Документ загружается... Если документ не отображается, убедитесь что он доступен для просмотра.
          </p>
        </div>
      )}

      <div className={`relative w-full ${isFullscreen ? 'h-full' : ''}`} style={{ height: isFullscreen ? '100vh' : '600px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Загрузка документа...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg">
            <div className="text-center">
              <p className="text-red-600 mb-2">Ошибка загрузки документа</p>
              <p className="text-sm text-gray-600">{error}</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                Открыть в новой вкладке
              </a>
            </div>
          </div>
        )}

        <iframe
          src={embedUrl}
          className={`w-full h-full ${isFullscreen ? 'border-0' : 'border border-gray-300 rounded-lg'}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setError('Не удалось загрузить документ. Проверьте настройки доступа.')
          }}
          title={title}
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>

      {/* Кнопки управления */}
      <div className={`mt-4 ${isFullscreen ? 'fixed top-4 right-4 z-50' : 'text-center'}`}>
        <div className="flex gap-2 justify-center">
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4" />
                Выйти из полноэкранного режима
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                Полноэкранный режим
              </>
            )}
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Открыть в новой вкладке
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
} 