import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

export const userApp = new Hono<{ Bindings: Bindings }>()

const mapUserFromRow = (row: any) => ({
  id: row.id,
  username: row.username,
  fullName: row.full_name,
  role: row.role,
  password: row.password,
  email: row.email,
  phone: row.phone,
  jawatan: row.jawatan,
  bahagian: row.bahagian,
  unit: row.unit,
  department: row.department,
  avatarUrl: row.avatar_url
})

// GET /api/users
userApp.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM app_users').all()
  return c.json(results.map(mapUserFromRow))
})

// POST /api/users
userApp.post('/', async (c) => {
  const body = await c.req.json()
  const newId = Date.now()
  
  const dbUser = {
    id: newId,
    username: body.username,
    full_name: body.fullName,
    role: body.role,
    password: body.password,
    email: body.email,
    phone: body.phone,
    jawatan: body.jawatan,
    bahagian: body.bahagian,
    unit: body.unit,
    department: body.department,
    avatar_url: body.avatarUrl
  }

  // Replace all undefined values with null for SQLite compatibility
  Object.keys(dbUser).forEach(key => {
    if ((dbUser as any)[key] === undefined) {
      (dbUser as any)[key] = null
    }
  })

  const keys = Object.keys(dbUser)
  const values = Object.values(dbUser)
  const placeholders = keys.map(() => '?').join(', ')

  await c.env.DB.prepare(`INSERT INTO app_users (${keys.join(', ')}) VALUES (${placeholders})`)
    .bind(...values)
    .run()

  return c.json(mapUserFromRow(dbUser))
})

// PUT /api/users/:id
userApp.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  const dbUpdates: Record<string, any> = {}
  
  if (body.username !== undefined) dbUpdates.username = body.username
  if (body.fullName !== undefined) dbUpdates.full_name = body.fullName
  if (body.role !== undefined) dbUpdates.role = body.role
  if (body.password !== undefined) dbUpdates.password = body.password
  if (body.email !== undefined) dbUpdates.email = body.email
  if (body.phone !== undefined) dbUpdates.phone = body.phone
  if (body.jawatan !== undefined) dbUpdates.jawatan = body.jawatan
  if (body.bahagian !== undefined) dbUpdates.bahagian = body.bahagian
  if (body.unit !== undefined) dbUpdates.unit = body.unit
  if (body.department !== undefined) dbUpdates.department = body.department
  if (body.avatarUrl !== undefined) dbUpdates.avatar_url = body.avatarUrl

  const keys = Object.keys(dbUpdates)
  if (keys.length === 0) return c.json({ error: 'No fields to update' }, 400)

  const setClauses = keys.map((k) => `${k} = ?`).join(', ')
  const values = Object.values(dbUpdates)

  await c.env.DB.prepare(`UPDATE app_users SET ${setClauses} WHERE id = ?`)
    .bind(...values, id)
    .run()

  const { results } = await c.env.DB.prepare('SELECT * FROM app_users WHERE id = ?').bind(id).all()
  return c.json(mapUserFromRow(results[0]))
})

// DELETE /api/users/:id
userApp.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM app_users WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})
