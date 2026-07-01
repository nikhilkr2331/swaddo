module.exports = {
  apps: [
    {
      name: "swaddo-api",
      script: "./dist/server.js",
      instances: "max", // Run as many instances as there are CPU cores
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "swaddo-workers",
      script: "./dist/services/worker.js",
      instances: 2, // 2 dedicated worker threads for background jobs
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    }
  ],
};
