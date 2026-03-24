import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'

import { projectApp } from './routes/projects'
import { userApp } from './routes/users'
import { bulletinApp } from './routes/bulletins'
import { systemApp } from './routes/system'
import { storageApp } from './routes/storage'

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

// Disable caching for DATA routes (Projects & System) - GET ONLY
app.use('/projects/*', async (c, next) => {
  await next()
  if (c.req.method === 'GET') {
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  }
})
app.use('/system/*', async (c, next) => {
  await next()
  if (c.req.method === 'GET') {
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  }
})

// Allow caching for STORAGE FILES (Images) - GET ONLY
app.use('/storage/file/*', async (c, next) => {
  await next()
  if (c.req.method === 'GET') {
    c.header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
  }
})

// Gallery List must be fresh - GET ONLY
app.use('/storage/gallery', async (c, next) => {
  await next()
  if (c.req.method === 'GET') {
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  }
})

// Mount sub-routers
app.route('/projects', projectApp)
app.route('/users', userApp)
app.route('/bulletins', bulletinApp)
app.route('/system', systemApp)
app.route('/storage', storageApp)

app.get('/health', (c) => {
  return c.json({ status: 'ok', message: 'InfraHub API is running on Cloudflare Pages!' })
})

// Authentication API
app.post('/auth/login', async (c) => {
  const body = await c.req.json()
  const { username, password } = body

  const { results } = await c.env.DB.prepare('SELECT * FROM app_users WHERE username = ? AND password = ?')
    .bind(username, password)
    .all()

  if (results && results.length > 0) {
    const rawUser: any = results[0]
    const user = {
      ...rawUser,
      fullName: rawUser.full_name,
      avatarUrl: rawUser.avatar_url
    }
    // Generate simple token for local testing
    const token = btoa(`${user.id}:${user.username}:${Date.now()}`)
    return c.json({ token, user })
  }

  return c.json({ error: 'Invalid credentials' }, 401)
})

export const onRequest = handle(app)
