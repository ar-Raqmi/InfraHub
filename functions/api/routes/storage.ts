import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { StorageRepository } from '../repositories/StorageRepository'

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
}

export const storageApp = new Hono<{ Bindings: Bindings }>()

storageApp.use('*', cors())

storageApp.use('*', async (c, next) => {
  if (!c.env.DB) {
    return c.json({ error: 'D1 DB binding is missing. Please bind your D1 database to the DB variable in the Cloudflare Pages settings (Settings -> Functions).' }, 500)
  }
  if (!c.env.BUCKET) {
    return c.json({ error: 'R2 BUCKET binding is missing. Please bind your R2 bucket to the BUCKET variable in the Cloudflare Pages settings (Settings -> Functions).' }, 500)
  }
  await next()
})

// GET /api/storage/gallery
storageApp.get('/gallery', async (c) => {
  const limit = Number(c.req.query('limit')) || 24
  const offset = Number(c.req.query('offset')) || 0
  const repo = new StorageRepository(c.env.DB, c.env.BUCKET)
  const items = await repo.getGallery(limit, offset)
  return c.json(items)
})

// POST /api/storage/upload
storageApp.post('/upload', async (c) => {
  const formData = await c.req.formData()

  const file = formData.get('file') as File
  const userId = formData.get('userId') as string
  const userFullName = formData.get('userFullName') as string
  const projectId = formData.get('projectId') as string | undefined
  const location = formData.get('location') as string | undefined

  if (!file || !userId || !userFullName) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  const repo = new StorageRepository(c.env.DB, c.env.BUCKET)
  try {
    const uploaded = await repo.upload(file, userId, userFullName, projectId, location)
    return c.json(uploaded)
  } catch (err: any) {
    return c.json({ error: err.message || 'Invalid file upload' }, 400)
  }
})

// GET /api/storage/file/:filename
storageApp.get('/file/:filename', async (c) => {
  const filename = c.req.param('filename')
  const repo = new StorageRepository(c.env.DB, c.env.BUCKET)
  const object = await repo.getFile(filename)

  if (!object) return c.json({ error: 'Not found' }, 404)

  c.header('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
  c.header('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
  return c.body(object.body)
})

// PUT /api/storage/gallery/:id/location
storageApp.put('/gallery/:id/location', async (c) => {
  const id = c.req.param('id')
  const { location } = await c.req.json()
  const repo = new StorageRepository(c.env.DB, c.env.BUCKET)
  await repo.updateLocation(id, location)
  return c.json({ success: true })
})

// DELETE /api/storage/gallery/:id
storageApp.delete('/gallery/:id', async (c) => {
  const id = c.req.param('id')
  const repo = new StorageRepository(c.env.DB, c.env.BUCKET)
  await repo.delete(id)
  return c.json({ success: true })
})

// DELETE /api/storage/gallery/cleanup
storageApp.delete('/cleanup', async (c) => {
  const repo = new StorageRepository(c.env.DB, c.env.BUCKET)
  const count = await repo.cleanup()
  return c.json({ success: true, count })
})
