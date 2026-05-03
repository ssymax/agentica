import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, mode }) => {
  const config = {
    plugins: [react(), tailwindcss()],
  }

  if (command === 'serve') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    const devPort = env.VITE_DEV_PORT
    const apiProxyTarget = env.VITE_API_PROXY_TARGET

    if (!devPort) {
      throw new Error('VITE_DEV_PORT environment variable is required')
    }

    if (!apiProxyTarget) {
      throw new Error('VITE_API_PROXY_TARGET environment variable is required')
    }

    return {
      ...config,
      server: {
        port: Number(devPort),
        proxy: {
          '/api': {
            target: apiProxyTarget,
            changeOrigin: true,
          },
        },
      },
    }
  }

  return config
})
