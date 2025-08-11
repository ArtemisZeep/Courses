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

        {/* Information */}
        <div className="grid gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Платформа для обучения Excel - https://excel-edu.ru/</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-600">
                Здесь вы учитесь по модулям: читаете уроки, сдаёте тесты и загружаете практические задания.
              </p>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Что вы можете делать</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Учиться по модулям: читать уроки и отмечать их как прочитанные.</li>
                  <li>Сдавать тесты (квизы): можно пересдавать, засчитывается лучший результат.</li>
                  <li>Загружать решения практических заданий (файлы).</li>
                  <li>Смотреть свой прогресс.</li>
                  <li>Участвовать в рейтинге и смотреть таблицу лидеров.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Как зарегистрироваться</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Откройте страницу «Регистрация».</li>
                  <li>Укажите имя (Фамилия и имя), email и пароль (не меньше 6 символов), подтвердите пароль.</li>
                  <li>Нажмите «Зарегистрироваться».</li>
                  <li>После этого войдите через «Вход» с вашим email и паролем.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Как открыть следующий модуль</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Модули идут по порядку. Первый — доступен сразу.</li>
                  <li>Чтобы открыть следующий, в текущем модуле нужно:</li>
                  <ul className="list-disc list-inside ml-6 space-y-1">
                    <li>сдать тест минимум на 50%;</li>
                    <li>загрузить файл с решением задания.</li>
                  </ul>
                  <li>Если в модуле нет задания, достаточно сдать тест на 50% и выше.</li>
                  <li>Как только условия выполнены, следующий модуль откроется автоматически.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
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
