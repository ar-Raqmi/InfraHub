import type { Context } from 'hono'
import type { AppBindings } from './types'

export interface Actor {
  id: number | null
  name: string | null
}

// The acting user is named by the client (X-InfraHub-User: <app_users.id>); the name is looked up for the log.
export async function actorFrom(c: Context<{ Bindings: AppBindings }>): Promise<Actor> {
  const id = Number(c.req.header('X-InfraHub-User'))
  if (!Number.isInteger(id) || id <= 0) return { id: null, name: null }
  const row = await c.env.DB.prepare('SELECT full_name FROM app_users WHERE id = ?').bind(id).first<{ full_name: string }>()
  return { id, name: row?.full_name ?? null }
}

export class HttpError extends Error {
  constructor(public status: 400 | 404 | 409 | 423 | 501, message: string, public detail?: unknown) {
    super(message)
  }
}

export const nowIso = (): string => new Date().toISOString()
export const newId = (prefix: string): string => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
