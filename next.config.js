/** @type {import('next').NextConfig} */
const nextConfig = {
  // Базовый путь для деплоя на поддомене
  basePath: '/course',
  
  // Настройки изображений
  images: {
    unoptimized: true, // Для статического экспорта
  },
  
  // Переменные окружения
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // ESLint настройки для продакшена
  eslint: {
    ignoreDuringBuilds: true, // Игнорировать ESLint ошибки при сборке
  },
  
  // TypeScript настройки для продакшена
  typescript: {
    ignoreBuildErrors: true, // Игнорировать TypeScript ошибки при сборке
  },
  
  // Заголовки для безопасности
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Настройки для предотвращения статического рендеринга API роутов
  serverExternalPackages: ['bcryptjs'],
};

module.exports = nextConfig;
