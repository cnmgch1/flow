module.exports = {
  apps: [
    {
      name: 'flow-reader',
      script: 'node',
      args: '/root/flow/apps/reader/.next/standalone/apps/reader/server.js',
      cwd: '/root/flow/apps/reader/.next/standalone/apps/reader',
      env: {
        NODE_ENV: 'production',
        PORT: 7127,
        // Set the correct working directory to ensure static files are found
        __NEXT_PROCESSED_ENV: true,
        // Ensure the correct hostname is used
        HOSTNAME: '0.0.0.0'
      }
    }
  ]
}