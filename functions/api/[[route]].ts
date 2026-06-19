import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

import { projectApp } from './routes/projects'
import { userApp } from './routes/users'
import { bulletinApp } from './routes/bulletins'
import { systemApp } from './routes/system'
import { storageApp } from './routes/storage'
import { notificationApp } from './routes/notifications'

import { UserRepository } from './repositories/UserRepository'

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

app.use('*', cors())

app.onError((err, c) => {
  console.error(err)
  return c.json({
    error: err.name || 'Error',
    message: err.message,
    stack: err.stack
  }, 500)
})

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
app.route('/notifications', notificationApp)

app.get('/health', (c) => {
  return c.json({ status: 'ok', message: 'ElectricHub API is running on Cloudflare Pages!' })
})

app.get('/health/r2', async (c) => {
  try {
    if (!c.env.BUCKET) {
      return c.json({ status: 'error', message: 'R2 BUCKET binding is not configured' }, 500)
    }
    await c.env.BUCKET.list({ limit: 1 })
    return c.json({ status: 'ok', message: 'R2 BUCKET is accessible' })
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message || String(err) }, 500)
  }
})

app.onError((err, c) => {
  console.error('Unhandled error:', err?.message || err)
  return c.json({ error: err?.message || 'Internal server error' }, 500)
})

// Authentication API
app.post('/auth/login', async (c) => {
  const body = await c.req.json()
  const { username, password } = body

  const repo = new UserRepository(c.env.DB)
  const user = await repo.getByUsernameAndPassword(username, password)

  if (user) {
    // Generate simple token for local testing
    const token = btoa(`${user.id}:${user.username}:${Date.now()}`)
    return c.json({ token, user })
  }

  return c.json({ error: 'Invalid credentials' }, 401)
})

export const onRequest = handle(app)
