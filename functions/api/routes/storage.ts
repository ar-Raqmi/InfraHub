import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
}

export const storageApp = new Hono<{ Bindings: Bindings }>()

const mapTemporaryImageFromRow = (row: any) => ({
  id: row.id,
  createdAt: row.created_at,
  userId: row.user_id,
  userFullName: row.user_full_name,
  imageUrl: row.image_url,
  projectId: row.project_id,
  locationTag: row.location_tag
})

// GET /api/storage/gallery
storageApp.get('/gallery', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM temporary_gallery ORDER BY created_at DESC').all()
  return c.json(results.map(mapTemporaryImageFromRow))
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

  // Upload to R2 Bucket
  const fileExt = 'jpg'
  const fileName = `${userId}_${Date.now()}.${fileExt}`
  
  await c.env.BUCKET.put(fileName, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || 'image/jpeg' }
  })

  // We need the public URL of the uploaded image. 
  // R2 buckets require a custom domain. We assume one is set up based on the Worker's host.
  // Using the worker's own endpoint to serve images for simplicity during migration:
  const origin = new URL(c.req.url).origin
  const imageUrl = `${origin}/api/storage/file/${fileName}`

  const newId = Date.now().toString()
  const dbItem = {
    id: newId,
    user_id: Number(userId),
    user_full_name: userFullName,
    image_url: imageUrl,
    project_id: projectId ? Number(projectId) : null,
    location_tag: location || null,
    created_at: new Date().toISOString()
  }

  const keys = Object.keys(dbItem)
  const values = Object.values(dbItem)
  const pl = keys.map(() => '?').join(', ')

  await c.env.DB.prepare(`INSERT INTO temporary_gallery (${keys.join(', ')}) VALUES (${pl})`)
    .bind(...values)
    .run()

  return c.json(mapTemporaryImageFromRow(dbItem))
})

// GET /api/storage/file/:filename
// This serves images directly from the R2 bucket
storageApp.get('/file/:filename', async (c) => {
  const filename = c.req.param('filename')
  const object = await c.env.BUCKET.get(filename)
  
  if (!object) return c.json({ error: 'Not found' }, 404)
  
  c.header('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
  c.header('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
  return c.body(object.body)
})

// PUT /api/storage/gallery/:id/location
storageApp.put('/gallery/:id/location', async (c) => {
  const id = c.req.param('id')
  const { location } = await c.req.json()

  await c.env.DB.prepare('UPDATE temporary_gallery SET location_tag = ? WHERE id = ?')
    .bind(location, id)
    .run()

  return c.json({ success: true })
})

// DELETE /api/storage/gallery/:id
storageApp.delete('/gallery/:id', async (c) => {
  const id = c.req.param('id')
  const { imageUrl } = await c.req.json()

  // Extract filename from URL (e.g., http://locahost/api/storage/file/123_456.jpg)
  const parts = imageUrl.split('/')
  const fileName = parts[parts.length - 1]

  // Delete from R2
  await c.env.BUCKET.delete(fileName)

  // Delete from DB 
  await c.env.DB.prepare('DELETE FROM temporary_gallery WHERE id = ?').bind(id).run()

  return c.json({ success: true })
})

// DELETE /api/storage/gallery/cleanup
storageApp.delete('/cleanup', async (c) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  // Find expired
  const { results: expiredImages } = await c.env.DB.prepare(
    'SELECT id, image_url FROM temporary_gallery WHERE created_at < ?'
  ).bind(twentyFourHoursAgo).all()

  if (expiredImages && expiredImages.length > 0) {
    const ids = []
    for (const img of expiredImages) {
      ids.push(img.id)
      const parts = (img.image_url as string).split('/')
      const fileName = parts[parts.length - 1]
      await c.env.BUCKET.delete(fileName)
    }

    const pl = ids.map(() => '?').join(',')
    await c.env.DB.prepare(`DELETE FROM temporary_gallery WHERE id IN (${pl})`).bind(...ids).run()
  }

  return c.json({ success: true, count: expiredImages ? expiredImages.length : 0 })
})
