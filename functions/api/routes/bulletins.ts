import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

export const bulletinApp = new Hono<{ Bindings: Bindings }>()

const parseJsonArray = (val: string | null) => val ? JSON.parse(val) : []
const parseJsonObject = (val: string | null) => val ? JSON.parse(val) : {}

const mapBulletinFromRow = (row: any) => ({
  id: row.id,
  content: row.content,
  date: row.date,
  author: row.author,
  readBy: parseJsonArray(row.read_by),
  reactions: parseJsonObject(row.reactions)
})

// GET /api/bulletins
bulletinApp.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM bulletins ORDER BY date DESC, id DESC').all()
  return c.json(results.map(mapBulletinFromRow))
})

// POST /api/bulletins
bulletinApp.post('/', async (c) => {
  const { content, author } = await c.req.json()
  const id = Date.now().toString()
  const date = new Date().toISOString().split('T')[0]
  
  // Clean up old bulletins (keep only max 3)
  const { results: existing } = await c.env.DB.prepare('SELECT id FROM bulletins ORDER BY date DESC, id DESC').all()
  if (existing && existing.length >= 3) {
    const idsToDelete = existing.slice(2).map(r => r.id as string)
    const placeholders = idsToDelete.map(() => '?').join(',')
    await c.env.DB.prepare(`DELETE FROM bulletins WHERE id IN (${placeholders})`).bind(...idsToDelete).run()
  }

  const dbItem = { id, content, date, author, read_by: '[]', reactions: '{}' }
  
  // Replace all undefined values with null for SQLite compatibility
  Object.keys(dbItem).forEach(key => {
    if ((dbItem as any)[key] === undefined) {
      (dbItem as any)[key] = null
    }
  })

  const keys = Object.keys(dbItem)
  const values = Object.values(dbItem)
  const pl = keys.map(() => '?').join(',')

  await c.env.DB.prepare(`INSERT INTO bulletins (${keys.join(',')}) VALUES (${pl})`).bind(...values).run()

  return c.json(mapBulletinFromRow(dbItem))
})

// PUT /api/bulletins/:id/read
bulletinApp.put('/:id/read', async (c) => {
  const id = c.req.param('id')
  const { userId } = await c.req.json()

  const { results } = await c.env.DB.prepare('SELECT read_by FROM bulletins WHERE id = ?').bind(id).all()
  if (!results || results.length === 0) return c.json({ error: 'Not found' }, 404)

  const readBy = parseJsonArray(results[0].read_by as string)
  if (!readBy.includes(userId)) {
    readBy.push(userId)
    await c.env.DB.prepare('UPDATE bulletins SET read_by = ? WHERE id = ?').bind(JSON.stringify(readBy), id).run()
  }

  return c.json({ success: true })
})

// PUT /api/bulletins/:id/react
bulletinApp.put('/:id/react', async (c) => {
  const id = c.req.param('id')
  const { userId, emoji } = await c.req.json()

  const { results } = await c.env.DB.prepare('SELECT reactions FROM bulletins WHERE id = ?').bind(id).all()
  if (!results || results.length === 0) return c.json({ error: 'Not found' }, 404)

  const reactions = parseJsonObject(results[0].reactions as string)
  const userList = reactions[emoji] || []

  if (userList.includes(userId)) {
    reactions[emoji] = userList.filter((uid: number) => uid !== userId)
    if (reactions[emoji].length === 0) delete reactions[emoji]
  } else {
    reactions[emoji] = [...userList, userId]
  }

  await c.env.DB.prepare('UPDATE bulletins SET reactions = ? WHERE id = ?').bind(JSON.stringify(reactions), id).run()

  return c.json({ success: true })
})

// DELETE /api/bulletins/:id
bulletinApp.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM bulletins WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})
