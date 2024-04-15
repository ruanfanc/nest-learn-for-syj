module.exports = {
  apps: [
    {
      name: "youth-law-server",
      script: "./dist/main.js",
      instances: "2",
      watch: true,
      ignore_watch: ["logs", "node_modules"],
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
