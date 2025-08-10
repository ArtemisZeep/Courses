'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowLeft } from 'lucide-react'
import styles from './quiz-success.module.css'

interface QuizSuccessProps {
  moduleId: string
  onReturnToModule: () => void
}

export default function QuizSuccess({ moduleId, onReturnToModule }: QuizSuccessProps) {
  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader>
          <div className={styles.iconWrap}>
            <CheckCircle2 className={styles.icon} />
          </div>
          <CardTitle className={styles.title}>
            🎉 Тест успешно отправлен!
          </CardTitle>
        </CardHeader>
        <CardContent className={styles.content}>
          <div className={styles.muted}>
            <p>Ваши ответы сохранены и обработаны.</p>
            <p>Результаты будут отображены после обновления страницы.</p>
          </div>
          
          <div className={styles.actions}>
            <Button 
              onClick={onReturnToModule}
              className={styles.fullWidthBtn}
              size="lg"
            >
              <ArrowLeft className={styles.backIcon} />
              Вернуться к модулю
            </Button>
            
            <p className={styles.note}>
              Страница автоматически обновится через несколько секунд
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
