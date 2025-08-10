'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'
import { PASS_THRESHOLD_PERCENT } from '@/lib/constants'

interface AnswerOption {
  id: string
  text: string
  order: number
}

interface Question {
  id: string
  title: string
  description?: string
  type: 'single' | 'multiple'
  order: number
  options: AnswerOption[]
}

interface QuizProps {
  questions: Question[]
  onSubmit: (answers: { questionId: string; selectedOptionIds: string[] }[]) => Promise<void>
  onRetake?: () => void
  isSubmitted?: boolean
  result?: {
    id: string
    scorePercent: number
    correctAnswers: number
    totalQuestions: number
    attemptId: string
    attempt: {
      answers: {
        questionId: string
        selectedOptionIds: string[]
        correctOptionIds: string[]
        isCorrect: boolean
      }[]
    }
  }
}

export default function Quiz({ questions, onSubmit, onRetake, isSubmitted, result }: QuizProps) {
  const router = useRouter()
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAnswers, setShowAnswers] = useState(false)

  // Восстанавливаем выбранные ответы из результатов теста только если тест завершен
  useEffect(() => {
    if (isSubmitted && result?.attempt?.answers) {
      const restoredAnswers: Record<string, string[]> = {}
      result.attempt.answers.forEach(answer => {
        restoredAnswers[answer.questionId] = answer.selectedOptionIds
      })
      setSelectedAnswers(restoredAnswers)
    } else if (!isSubmitted) {
      // Если тест не завершен (режим прохождения), очищаем ответы
      setSelectedAnswers({})
      setShowAnswers(false) // Также скрываем ответы при новом прохождении
    }
  }, [result, isSubmitted])

  const handleAnswerSelect = (questionId: string, optionId: string, isMultiple: boolean) => {
    setSelectedAnswers(prev => {
      const current = prev[questionId] || []
      
      if (isMultiple) {
        // Для множественного выбора
        if (current.includes(optionId)) {
          return { ...prev, [questionId]: current.filter(id => id !== optionId) }
        } else {
          return { ...prev, [questionId]: [...current, optionId] }
        }
      } else {
        // Для единичного выбора
        return { ...prev, [questionId]: [optionId] }
      }
    })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    const answers = questions.map(question => ({
      questionId: question.id,
      selectedOptionIds: selectedAnswers[question.id] || []
    }))

    await onSubmit(answers)
    setIsSubmitting(false)
  }

  const isAnswerSelected = (questionId: string, optionId: string) => {
    return (selectedAnswers[questionId] || []).includes(optionId)
  }

  const getAnswerStatus = (questionId: string, optionId: string) => {
    if (!result || !result.attempt) return null
    
    // Находим детальную информацию об ответе
    const answerData = result.attempt.answers.find(a => a.questionId === questionId)
    if (!answerData) return null

    // Проверяем, был ли выбран этот ответ
    const wasSelected = answerData.selectedOptionIds.includes(optionId)
    
    // Проверяем, является ли этот ответ правильным
    const isCorrectOption = answerData.correctOptionIds.includes(optionId)
    
    if (wasSelected && isCorrectOption) return 'correct'
    if (wasSelected && !isCorrectOption) return 'incorrect'  
    if (!wasSelected && isCorrectOption) return 'missed'
    return null
  }

  const getQuestionStatus = (questionId: string) => {
    if (!result || !result.attempt) return null
    
    const answerData = result.attempt.answers.find(a => a.questionId === questionId)
    return answerData?.isCorrect ? 'correct' : 'incorrect'
  }

  return (
    <div className="space-y-6">
      {!isSubmitted ? (
        <>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Тест по модулю</h2>
            <p className="text-gray-600">
              Ответьте на все вопросы. Для прохождения необходимо набрать минимум {PASS_THRESHOLD_PERCENT}%.
            </p>
          </div>

          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Вопрос {index + 1}
                  <Badge variant={question.type === 'single' ? 'default' : 'secondary'}>
                    {question.type === 'single' ? 'Один ответ' : 'Несколько ответов'}
                  </Badge>
                </CardTitle>
                <CardDescription>{question.title}</CardDescription>
                {question.description && (
                  <p className="text-sm text-gray-600">{question.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {question.options.map((option) => (
                    <label 
                      key={option.id} 
                      className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition-colors ${
                        isAnswerSelected(question.id, option.id) 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type={question.type === 'single' ? 'radio' : 'checkbox'}
                        name={`question-${question.id}`}
                        value={option.id}
                        checked={isAnswerSelected(question.id, option.id)}
                        onChange={() => handleAnswerSelect(
                          question.id, 
                          option.id, 
                          question.type === 'multiple'
                        )}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        question.type === 'single' 
                          ? 'rounded-full' 
                          : 'rounded'
                      } ${
                        isAnswerSelected(question.id, option.id)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {isAnswerSelected(question.id, option.id) && (
                          <div className={`w-2 h-2 ${
                            question.type === 'single' 
                              ? 'bg-white rounded-full' 
                              : 'bg-white'
                          }`} />
                        )}
                      </div>
                      <span className="flex-1">{option.text}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="text-center">
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              size="lg"
              className="px-8"
            >
              {isSubmitting ? 'Отправка...' : 'Отправить тест'}
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Результаты теста</h2>
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Badge 
                variant={(result?.scorePercent || 0) >= PASS_THRESHOLD_PERCENT ? 'default' : 'secondary'}
                className="text-lg px-4 py-2"
              >
                {result?.scorePercent || 0}%
              </Badge>
              <span className={`text-lg font-semibold ${
                (result?.scorePercent || 0) >= PASS_THRESHOLD_PERCENT ? 'text-green-600' : 'text-red-600'
              }`}>
                {(result?.scorePercent || 0) >= PASS_THRESHOLD_PERCENT ? 'Пройден' : 'Не пройден'}
              </span>
              <div className="text-sm text-gray-600">
                {result?.correctAnswers}/{result?.totalQuestions} правильных ответов
              </div>
            </div>
          </div>

          {questions.map((question, index) => {
            const questionStatus = getQuestionStatus(question.id)
            const answerData = result?.attempt?.answers.find(a => a.questionId === question.id)
            
            return (
              <Card key={question.id} className={showAnswers ? 'border-2' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>Вопрос {index + 1}</span>
                      {showAnswers && questionStatus && (
                        <Badge 
                          variant={questionStatus === 'correct' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {questionStatus === 'correct' ? '✓ Правильно' : '✗ Неправильно'}
                        </Badge>
                      )}
                    </div>
                    <Badge variant={question.type === 'single' ? 'default' : 'secondary'}>
                      {question.type === 'single' ? 'Один ответ' : 'Несколько ответов'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{question.title}</CardDescription>
                  {question.description && (
                    <p className="text-sm text-gray-600">{question.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {question.options.map((option) => {
                      const status = getAnswerStatus(question.id, option.id)
                      const isSelected = answerData?.selectedOptionIds.includes(option.id) || false
                      
                      return (
                        <div 
                          key={option.id} 
                          className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                            showAnswers ? (
                              status === 'correct' ? 'bg-green-50 border-green-200 shadow-sm' :
                              status === 'incorrect' ? 'bg-red-50 border-red-200 shadow-sm' :
                              status === 'missed' ? 'bg-yellow-50 border-yellow-200 shadow-sm' :
                              'bg-gray-50'
                            ) : (
                              isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                            )
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            question.type === 'single' ? 'rounded-full' : 'rounded'
                          } ${
                            showAnswers ? (
                              status === 'correct' ? 'bg-green-600 border-green-600' :
                              status === 'incorrect' ? 'bg-red-600 border-red-600' :
                              status === 'missed' ? 'bg-yellow-600 border-yellow-600' :
                              'border-gray-300'
                            ) : (
                              isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                            )
                          }`}>
                            {(showAnswers ? (status === 'correct' || status === 'incorrect') : isSelected) && (
                              <div className={`w-2 h-2 ${
                                question.type === 'single' ? 'bg-white rounded-full' : 'bg-white'
                              }`} />
                            )}
                          </div>
                          <span className={`flex-1 ${
                            showAnswers && status === 'incorrect' ? 'line-through text-red-600' : ''
                          }`}>
                            {option.text}
                          </span>
                          {showAnswers && (
                            <div className="flex items-center space-x-1">
                              {status === 'correct' && <CheckCircle className="text-green-500" size={16} />}
                              {status === 'incorrect' && <XCircle className="text-red-500" size={16} />}
                              {status === 'missed' && <span className="text-yellow-600 text-sm">⚠️</span>}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  {showAnswers && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm text-blue-700">
                        <span className="font-medium">Ваши ответы:</span>
                        <span className="text-blue-600">
                          {answerData?.selectedOptionIds.length || 0} выбрано
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          <div className="text-center mt-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setShowAnswers(!showAnswers)}
                variant="secondary"
                size="lg"
                className="px-8"
              >
                {showAnswers ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Скрыть ответы
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Показать ответы
                  </>
                )}
              </Button>
              {onRetake && (
                <Button 
                  onClick={onRetake}
                  variant="outline"
                  size="lg"
                  className="px-8"
                >
                  🔄 Перепройти тест
                </Button>
              )}
              <Button 
                onClick={() => router.push('/dashboard')}
                size="lg"
                className="px-8"
              >
                📚 Вернуться к курсам
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 