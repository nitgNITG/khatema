module.exports = {
  apps: [
    {
      name: 'khatema-backend',
      cwd: './backend',
      script: 'node',
      args: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        BACKEND_PORT: 3010,
      },
    },
    {
      name: 'khatema-frontend',
      cwd: './frontend',
      script: 'node',
      args: 'node_modules/.bin/next start -p 3011',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3011,
      },
    },
  ],
};
