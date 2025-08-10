module.exports = {
  apps: [
    {
      name: 'excel-course',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/mapyg.ru/course',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'postgresql://artemiszeep:password@localhost:5432/excel_course',
        NEXTAUTH_SECRET: 'your-secret-key-here',
        NEXTAUTH_URL: 'https://mapyg.ru/course',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'postgresql://artemiszeep:password@localhost:5432/excel_course',
        NEXTAUTH_SECRET: 'your-secret-key-here',
        NEXTAUTH_URL: 'https://mapyg.ru/course',
      },
      error_file: '/var/log/pm2/excel-course-error.log',
      out_file: '/var/log/pm2/excel-course-out.log',
      log_file: '/var/log/pm2/excel-course-combined.log',
      time: true,
    },
  ],
};
