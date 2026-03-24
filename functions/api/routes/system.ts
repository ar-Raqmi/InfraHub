import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

export const systemApp = new Hono<{ Bindings: Bindings }>()

const parseJsonArray = (val: string | null) => val ? JSON.parse(val) : []
const parseJsonObject = (val: string | null) => val ? JSON.parse(val) : {}

// Settings API endpoints
// GET /api/system/settings/:year
systemApp.get('/settings/:year', async (c) => {
  const year = c.req.param('year')
  const { results } = await c.env.DB.prepare('SELECT * FROM system_settings WHERE year = ?').bind(year).all()
  
  if (!results || results.length === 0) {
    return c.json({ year: Number(year) }) // Return empty schema
  }
  
  const row = results[0]
  return c.json({
    year: row.year,
    companies: parseJsonArray(row.companies as string),
    company_order: parseJsonArray(row.company_order as string),
    company_details: parseJsonObject(row.company_details as string),
    vote_numbers: parseJsonArray(row.vote_numbers as string),
    sebutharga_numbers: parseJsonArray(row.sebutharga_numbers as string),
    manual_financials: parseJsonObject(row.manual_financials as string),
    meeting_date: row.meeting_date as string | null,
    meeting_number: row.meeting_number as string | null
  })
})

// PUT /api/system/settings/:year
systemApp.put('/settings/:year', async (c) => {
  const year = Number(c.req.param('year'))
  const body = await c.req.json()

  // First check if it exists
  const { results } = await c.env.DB.prepare('SELECT * FROM system_settings WHERE year = ?').bind(year).all()
  const exists = results && results.length > 0

  const dbUpdates: Record<string, string | number> = { year }
  if (body.companies !== undefined) dbUpdates.companies = JSON.stringify(body.companies)
  if (body.company_order !== undefined) dbUpdates.company_order = JSON.stringify(body.company_order)
  if (body.company_details !== undefined) dbUpdates.company_details = JSON.stringify(body.company_details)
  if (body.vote_numbers !== undefined) dbUpdates.vote_numbers = JSON.stringify(body.vote_numbers)
  if (body.sebutharga_numbers !== undefined) dbUpdates.sebutharga_numbers = JSON.stringify(body.sebutharga_numbers)
  if (body.manual_financials !== undefined) dbUpdates.manual_financials = JSON.stringify(body.manual_financials)
  if (body.meeting_date !== undefined) dbUpdates.meeting_date = body.meeting_date
  if (body.meeting_number !== undefined) dbUpdates.meeting_number = body.meeting_number

  const keys = Object.keys(dbUpdates)
  const values = Object.values(dbUpdates)

  if (exists) {
    const setClauses = keys.map(k => `${k} = ?`).join(', ')
    await c.env.DB.prepare(`UPDATE system_settings SET ${setClauses} WHERE year = ?`)
      .bind(...values, year)
      .run()
  } else {
    const pl = keys.map(() => '?').join(', ')
    await c.env.DB.prepare(`INSERT INTO system_settings (${keys.join(', ')}) VALUES (${pl})`)
      .bind(...values)
      .run()
  }

  return c.json({ success: true })
})

// Library Groups API
// GET /api/system/library_groups
systemApp.get('/library_groups', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM library_groups').all()
  return c.json(results.map(row => ({
    id: row.id,
    title: row.title,
    category: row.category,
    items: parseJsonArray(row.items as string)
  })))
})

// PUT /api/system/library_groups
systemApp.put('/library_groups', async (c) => {
  const groups = await c.req.json()
  
  // Clean all and insert (simple upsert for groups)
  await c.env.DB.prepare('DELETE FROM library_groups').run()
  
  for (const g of groups) {
    await c.env.DB.prepare('INSERT INTO library_groups (id, title, category, items) VALUES (?, ?, ?, ?)')
      .bind(g.id, g.title, g.category, JSON.stringify(g.items))
      .run()
  }

  return c.json({ success: true })
})

// Templates API
// GET /api/system/templates
systemApp.get('/templates', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM templates ORDER BY order_index ASC').all()
  return c.json(results.map(row => ({
    id: row.id,
    key: row.key,
    title: row.title,
    subtitle: row.subtitle,
    icon: row.icon,
    color: row.color,
    bills: parseJsonArray(row.bills as string),
    groupRefs: parseJsonArray(row.group_refs as string),
    orderIndex: row.order_index
  })))
})

// PUT /api/system/templates
systemApp.put('/templates', async (c) => {
  const templates = await c.req.json()

  await c.env.DB.prepare('DELETE FROM templates').run()

  for (let i = 0; i < templates.length; i++) {
    const t = templates[i]
    await c.env.DB.prepare('INSERT INTO templates (id, key, title, subtitle, icon, color, bills, group_refs, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(t.id, t.key, t.title, t.subtitle ?? null, t.icon ?? null, t.color ?? null, JSON.stringify(t.bills || []), JSON.stringify(t.groupRefs || []), i)
      .run()
  }

  return c.json({ success: true })
})

// DELETE /api/system/templates/:id
systemApp.delete('/templates/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM templates WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})
