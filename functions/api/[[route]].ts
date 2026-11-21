import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

import { projectApp } from './routes/projects'
import { userApp } from './routes/users'
import { bulletinApp } from './routes/bulletins'
import { systemApp } from './routes/system'
import { storageApp } from './routes/storage'
import { notificationApp } from './routes/notifications'
import { contractApp } from './routes/contracts'
import { rateBookApp, changeLogApp } from './routes/rateBook'
import { configApp, lookupApp, policyApp, adminApp, aiApp } from './routes/orgConfig'
import { HttpError } from './actor'

import { UserRepository } from './repositories/UserRepository'
import { AppBindings } from './types'

const app = new Hono<{ Bindings: AppBindings }>().basePath('/api')

app.use('*', cors())

app.onError((err, c) => {
  if (err instanceof HttpError) {
    return c.json({ error: err.name, message: err.message, detail: err.detail }, err.status)
  }
  console.error(err)
  return c.json({
    error: err.name || 'Error',
    message: err.message,
    stack: err.stack
  }, 500)
})

// Cache-Control middleware factory: applies the given header to GET responses.
const cacheControl = (value: string) => async (c: any, next: any) => {
  await next()
  if (c.req.method === 'GET') {
    c.header('Cache-Control', value)
  }
}

// Disable caching for DATA routes (Projects & System) - GET ONLY
app.use('/projects/*', cacheControl('no-cache, no-store, must-revalidate'))
app.use('/system/*', cacheControl('no-cache, no-store, must-revalidate'))
for (const p of ['/contracts/*', '/rate-book/*', '/changelog/*', '/config/*', '/lookups/*', '/policies/*']) {
  app.use(p, cacheControl('no-cache, no-store, must-revalidate'))
}

// Allow caching for STORAGE FILES (Images) - GET ONLY
app.use('/storage/file/*', cacheControl('public, max-age=3600')) // Cache for 1 hour

// Gallery List must be fresh - GET ONLY
app.use('/storage/gallery', cacheControl('no-cache, no-store, must-revalidate'))

// Mount sub-routers
app.route('/projects', projectApp)
app.route('/users', userApp)
app.route('/bulletins', bulletinApp)
app.route('/system', systemApp)
app.route('/storage', storageApp)
app.route('/notifications', notificationApp)
app.route('/contracts', contractApp)
app.route('/rate-book', rateBookApp)
app.route('/changelog', changeLogApp)
app.route('/config', configApp)
app.route('/lookups', lookupApp)
app.route('/policies', policyApp)
app.route('/v2/admin', adminApp)
app.route('/ai', aiApp)

app.get('/health', (c) => {
  return c.json({ status: 'ok', message: 'InfraHub API is running on Cloudflare Pages!' })
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
