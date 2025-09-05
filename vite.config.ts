import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 개발 중 클라이언트 로그를 터미널로 포워딩하는 간단한 미들웨어
    {
      name: 'indark-dev-log',
      configureServer(server) {
        server.middlewares.use('/__indark-log', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end()
            return
          }
          try {
            const chunks: Buffer[] = []
            for await (const chunk of req as any) chunks.push(chunk as Buffer)
            const bodyStr = Buffer.concat(chunks).toString('utf-8')
            const { tag, payload } = JSON.parse(bodyStr || '{}')
            // eslint-disable-next-line no-console
            console.log(`[InDarkTerm] ${tag}`, payload)
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[InDarkTerm] Failed to parse log payload', e)
          }
          res.statusCode = 204
          res.end()
        })
      },
    },
    // 빌드 후 stats.html 리포트 생성
    visualizer({
      filename: 'stats.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
      chunkSizeWarningLimit: 1600,
    },
})
