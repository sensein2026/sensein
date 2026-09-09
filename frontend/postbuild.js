import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, 'dist')

if (fs.existsSync(distDir)) {
  const indexHtml = path.join(distDir, 'index.html')
  if (fs.existsSync(indexHtml)) {
    // 1. Create 404.html for universal SPA fallback
    fs.copyFileSync(indexHtml, path.join(distDir, '404.html'))

    // 2. Create physical directory routes for direct browser access
    const routes = [
      'admin',
      'admin/products',
      'admin/orders',
      'admin/users',
      'shop',
      'login',
      'register',
      'checkout',
      'track-order',
      'about',
      'contact',
    ]

    for (const route of routes) {
      const targetDir = path.join(distDir, route)
      fs.mkdirSync(targetDir, { recursive: true })
      fs.copyFileSync(indexHtml, path.join(targetDir, 'index.html'))
    }

    console.log('✅ Postbuild: Generated 404.html and static SPA routes for Vercel.')
  }
}
