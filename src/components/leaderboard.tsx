'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  email: string
  totalScore: number
  quizScore: number
  assignmentScore: number
  completedModules: number
  isAdmin?: boolean
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  totalUsers: number
}

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard')
      if (response.ok) {
        const result = await response.json()
        console.log('Leaderboard API response:', result)
        setData(result)
      } else {
        setError('Ошибка при загрузке таблицы лидеров')
      }
    } catch (err) {
      console.error('Leaderboard fetch error:', err)
      setError('Ошибка при загрузке таблицы лидеров')
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return `${rank}.`
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-600 font-bold'
      case 2:
        return 'text-gray-500 font-bold'
      case 3:
        return 'text-amber-600 font-bold'
      default:
        return 'text-gray-700'
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">🏆 Таблица лидеров</h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">🏆 Таблица лидеров</h2>
        <div className="text-red-500 text-center py-4">
          {error}
        </div>
      </Card>
    )
  }

  if (!data || data.leaderboard.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">🏆 Таблица лидеров</h2>
        <div className="text-gray-500 text-center py-8">
          Пока нет данных для отображения лидеров.
          <br />
          Начните проходить тесты и выполнять задания!
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">🏆 Таблица лидеров</h2>
        <Badge variant="outline" className="text-xs">
          Топ {data.leaderboard.length}
        </Badge>
      </div>

      <div className="space-y-3">
        {data.leaderboard.map((entry) => (
          <div
            key={entry.userId}
            className={`flex items-center space-x-4 p-3 rounded-lg transition-colors ${
              entry.rank <= 3 
                ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' 
                : 'hover:bg-gray-50'
            }`}
          >
            {/* Место в рейтинге */}
            <div className={`text-2xl min-w-[40px] text-center ${getRankColor(entry.rank)}`}>
              {getRankIcon(entry.rank)}
            </div>

            {/* Информация о студенте */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate flex items-center gap-2">
                {entry.name}
                {entry.isAdmin && (
                  <Badge variant="outline" className="text-xs">
                    Админ
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {entry.email}
              </div>
            </div>

            {/* Детализация баллов */}
            <div className="hidden sm:flex flex-col text-right text-xs space-y-1">
              {entry.quizScore > 0 && (
                <div className="text-blue-600">
                  🧠 Тесты: {entry.quizScore}
                </div>
              )}
              {entry.assignmentScore > 0 && (
                <div className="text-green-600">
                  📝 Задания: {entry.assignmentScore}
                </div>
              )}
            </div>

            {/* Общий балл */}
            <div className="text-right">
              <div className={`text-lg font-bold ${getRankColor(entry.rank)}`}>
                {entry.totalScore}
              </div>
              <div className="text-xs text-gray-500">
                баллов
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Пояснение системы подсчета */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="font-medium text-gray-700">Система подсчета баллов:</div>
          <div>🧠 Тесты: до 100 баллов за 100% (70 баллов при пересдаче)</div>
          <div>📝 Задания: 0-100 баллов (оценка × 20)</div>
        </div>
      </div>
    </Card>
  )
}