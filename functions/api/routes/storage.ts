import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
}

export const storageApp = new Hono<{ Bindings: Bindings }>()

storageApp.use('*', cors())

const mapTemporaryImageFromRow = (row: any) => ({
  id: row.id,
  createdAt: row.created_at,
  userId: row.user_id,
  userFullName: row.user_full_name,
  imageUrl: row.image_url,
  thumbnailUrl: row.thumbnail_url || row.image_url,
  projectId: row.project_id,
  locationTag: row.location_tag
})

// GET /api/storage/gallery
storageApp.get('/gallery', async (c) => {
  const limit = Number(c.req.query('limit')) || 24;
  const offset = Number(c.req.query('offset')) || 0;

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM temporary_gallery ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset).all()

  return c.json(results.map(mapTemporaryImageFromRow))
})

// POST /api/storage/upload
storageApp.post('/upload', async (c) => {
  try {
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
    const timestamp = Date.now()
    const fileName = `${userId}_${timestamp}.${fileExt}`

    const buffer = await new Response(file).arrayBuffer()
    await c.env.BUCKET.put(fileName, buffer, {
      httpMetadata: { contentType: 'image/jpeg' }
    })

    // We need the public URL of the uploaded image. 
    const imageUrl = `/api/storage/file/${fileName}`

    const newId = timestamp.toString()
    const dbItem = {
      id: newId,
      user_id: Number(userId),
      user_full_name: userFullName,
      image_url: imageUrl,
      thumbnail_url: null, // New uploads don't have separate thumbnails
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
  } catch (err: any) {
    console.error('Upload error:', err?.message || err)
    return c.json({ error: err?.message || 'Internal server error' }, 500)
  }
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
  
  // Get the row first to find both image and thumbnail URLs
  const row: any = await c.env.DB.prepare('SELECT image_url, thumbnail_url FROM temporary_gallery WHERE id = ?')
    .bind(id)
    .first()

  if (row) {
    // Delete main image
    const parts = row.image_url.split('/')
    const fileName = parts[parts.length - 1]
    await c.env.BUCKET.delete(fileName)

    // Delete thumbnail if it exists
    if (row.thumbnail_url) {
      const thumbParts = row.thumbnail_url.split('/')
      const thumbFileName = thumbParts[thumbParts.length - 1]
      await c.env.BUCKET.delete(thumbFileName)
    }
  }

  // Delete from DB 
  await c.env.DB.prepare('DELETE FROM temporary_gallery WHERE id = ?').bind(id).run()

  return c.json({ success: true })
})

// DELETE /api/storage/gallery/cleanup
storageApp.delete('/cleanup', async (c) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Find expired
  const { results: expiredImages } = await c.env.DB.prepare(
    'SELECT id, image_url, thumbnail_url FROM temporary_gallery WHERE created_at < ?'
  ).bind(twentyFourHoursAgo).all()

  if (expiredImages && expiredImages.length > 0) {
    const ids = []
    for (const img of expiredImages) {
      ids.push(img.id)
      
      // Delete main image
      const parts = (img.image_url as string).split('/')
      const fileName = parts[parts.length - 1]
      await c.env.BUCKET.delete(fileName)
      
      // Delete thumbnail if it exists
      if (img.thumbnail_url) {
        const thumbParts = (img.thumbnail_url as string).split('/')
        const thumbFileName = thumbParts[thumbParts.length - 1]
        await c.env.BUCKET.delete(thumbFileName)
      }
    }

    const pl = ids.map(() => '?').join(',')
    await c.env.DB.prepare(`DELETE FROM temporary_gallery WHERE id IN (${pl})`).bind(...ids).run()
  }

  return c.json({ success: true, count: expiredImages ? expiredImages.length : 0 })
})
