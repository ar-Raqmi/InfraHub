import type { LookupValue, PolicyRuleRecord } from '../../../types'
import type { PolicyRule } from '../../../domain/policy'
import { BaseRepository } from './BaseRepository'

export class ConfigRepository extends BaseRepository {
  public async allConfig(): Promise<Record<string, unknown>> {
    const { results } = await this.db.prepare('SELECT key, value FROM app_config ORDER BY key').all<{ key: string; value: string }>()
    return Object.fromEntries(results.map((r) => [r.key, r.value === null ? null : JSON.parse(r.value)]))
  }

  public async getConfig(key: string): Promise<unknown> {
    const row = await this.db.prepare('SELECT value FROM app_config WHERE key = ?').bind(key).first<{ value: string }>()
    return row?.value ? JSON.parse(row.value) : null
  }

  public putConfig(key: string, value: unknown, at: string, by: number | null): D1PreparedStatement {
    return this.db.prepare(
      'INSERT INTO app_config (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by'
    ).bind(key, JSON.stringify(value), at, by)
  }

  public async lookups(list: string): Promise<LookupValue[]> {
    const { results } = await this.db.prepare('SELECT * FROM lookup_values WHERE list = ? ORDER BY sort_index, code').bind(list).all<any>()
    return results.map((r) => ({ code: r.code, label: r.label, sortIndex: r.sort_index, active: r.active === 1 }))
  }

  public replaceLookups(list: string, values: LookupValue[]): D1PreparedStatement[] {
    return [
      this.db.prepare('DELETE FROM lookup_values WHERE list = ?').bind(list),
      ...values.map((v, i) => this.insertLookup(list, v.code, v.label ?? v.code, v.sortIndex ?? i, v.active !== false, false)),
    ]
  }

  public insertLookup(list: string, code: string, label: string, sortIndex: number, active: boolean, ignoreExisting = true): D1PreparedStatement {
    return this.db.prepare(`INSERT ${ignoreExisting ? 'OR IGNORE ' : ''}INTO lookup_values (list, code, label, sort_index, active) VALUES (?, ?, ?, ?, ?)`)
      .bind(list, code, label, sortIndex, active ? 1 : 0)
  }

  public async policies(): Promise<PolicyRuleRecord[]> {
    const { results } = await this.db.prepare('SELECT * FROM policy_rules ORDER BY key, effective_from').all<any>()
    return results.map((r) => ({ key: r.key, effectiveFrom: r.effective_from, value: JSON.parse(r.value), note: r.note, createdAt: r.created_at, createdBy: r.created_by }))
  }

  /** Domain-shaped rules for policyAt(). */
  public async policyRules(): Promise<PolicyRule[]> {
    return (await this.policies()).map((p) => ({ key: p.key, effective_from: p.effectiveFrom, value: p.value, note: p.note }))
  }

  public putPolicy(rule: PolicyRule, at: string, by: number | null, ignoreExisting = false): D1PreparedStatement {
    const conflict = ignoreExisting ? 'DO NOTHING' : 'DO UPDATE SET value = excluded.value, note = excluded.note, created_at = excluded.created_at, created_by = excluded.created_by'
    return this.db.prepare(
      `INSERT INTO policy_rules (key, effective_from, value, note, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(key, effective_from) ${conflict}`
    ).bind(rule.key, rule.effective_from, JSON.stringify(rule.value), rule.note ?? null, at, by)
  }
}
