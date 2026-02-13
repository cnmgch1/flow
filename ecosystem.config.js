module.exports = {
  apps: [
    {
      name: 'flow-reader',
      script: 'node',
      args: '/root/flow/apps/reader/.next/standalone/apps/reader/server.js',
      cwd: '/root/flow',
      env: {
        NODE_ENV: 'production',
        PORT: 7127
      }
    },
    {
      name: 'flow-website',
      script: 'node',
      args: 'node_modules/next/dist/bin/next start -p 7117',
      cwd: '/root/flow/apps/website',
      env: {
        NODE_ENV: 'production',
        PORT: 7117
      }
    }
  ]
}