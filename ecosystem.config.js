module.exports = {
  apps: [
    {
      name: 'youth-law-server',
      script: './dist/main.js',
      instances: '1',
      watch: true,
      ignore_watch: ['pm2logs', 'node_modules'],
      error_file: './pm2logs/err.log',
      out_file: './pm2logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
