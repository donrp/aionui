module.exports = {
  apps: [
    {
      name: 'supernodes-demo',
      cwd: '/opt/supernodes',
      script: 'node_modules/.bin/tsx',
      // Drop privileges: PM2 daemon may run as root, app + Hermes run as supernodes.
      user: 'supernodes',
      // No --remote: bind 127.0.0.1 only; nginx + Cloudflare handle public traffic.
      args: 'scripts/webui.ts --no-build',
      env: {
        NODE_ENV: 'production',
        AIONUI_PORT: 3000,
        AIONUI_DATA_DIR: '/opt/supernodes/data/demo',
        HERMES_HOME: '/opt/supernodes/data/demo/hermes',
        AIONUI_NO_BUILD: '1',
      },
      watch: false,
      max_memory_restart: '500M',
      autorestart: true,
    },
  ],
};
