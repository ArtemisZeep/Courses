import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-600">📊 Excel Курс</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/auth/signin">
                <Button variant="outline">Войти</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Регистрация</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Изучайте Excel
            <span className="block text-green-600">с интерактивными уроками</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Профессиональная платформа для изучения Excel с практическими заданиями, 
            тестами и пошаговыми инструкциями. От основ до продвинутых функций.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8 py-3 text-lg">
                🚀 Начать обучение
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                📚 Войти в курс
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                📖 Интерактивные уроки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Изучайте Excel через практические примеры и пошаговые инструкции
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                🧪 Тесты и задания
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Проверяйте свои знания с помощью интерактивных тестов и практических заданий
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                📊 Отслеживание прогресса
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Следите за своим прогрессом и разблокируйте новые модули
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Demo Login */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">🎯 Демо-доступ</h3>
          <p className="text-gray-600 mb-6">
            Попробуйте платформу прямо сейчас с тестовыми аккаунтами:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="font-semibold text-blue-800 mb-2">👨‍🎓 Студент</h4>
              <p className="text-sm text-blue-600 mb-3">
                Email: student@example.com<br/>
                Пароль: student123
              </p>
              <Link href="/auth/signin">
                <Button variant="outline" size="sm">
                  Войти как студент
                </Button>
              </Link>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <h4 className="font-semibold text-green-800 mb-2">👨‍💼 Админ</h4>
              <p className="text-sm text-green-600 mb-3">
                Email: admin@example.com<br/>
                Пароль: admin123
              </p>
              <Link href="/auth/signin">
                <Button variant="outline" size="sm">
                  Войти как админ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 Excel Курс. Платформа для изучения Excel.</p>
        </div>
      </footer>
    </div>
  )
}
