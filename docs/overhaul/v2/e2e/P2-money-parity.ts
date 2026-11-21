// Money-rule parity: for every project on a server, run the OLD inline ProjectDetail effects (copied verbatim
// below, constants and all) and the NEW policy-fed path (components/detail/moneyRules.ts, which ProjectDetail
// now calls) over the saved project, and diff what each would write. Expect 0 diffs.
// Run: echo "export default {logLevel:'warn'}" > $TMPDIR/vp.mjs && node node_modules/vite/bin/vite.js build \
//        --config $TMPDIR/vp.mjs --ssr docs/overhaul/v2/e2e/P2-money-parity.ts --outDir $TMPDIR/parity \
//        && node $TMPDIR/parity/P2-money-parity.js http://localhost:8795 <userId>
import type { Project, PolicyRuleRecord } from '../../../../types';
import { ladPatch, ladPolicyFor, locPatch, locPolicyFor, settlementPatch, toPolicyRules } from '../../../../components/detail/moneyRules';

type Form = Partial<Project>;

// ---- OLD: pages/ProjectDetail.tsx effects before P2 (LAD :768-777, LoC :780-806, kos sebenar :808-850) ----
function oldLad(formData: Form): Form | null {
  if (formData.tarikhTamatKontrak && formData.tarikhSiapSebenar) {
    const endDate = new Date(formData.tarikhTamatKontrak); const actualDate = new Date(formData.tarikhSiapSebenar);
    const timeDiff = actualDate.getTime() - endDate.getTime(); const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const ladDays = dayDiff > 0 ? dayDiff : 0; const contractSum = formData.kosProjek || 0;
    const dailyRate = contractSum < 20000 ? 20.00 : Math.round(((contractSum * 0.064) / 365 + Number.EPSILON) * 100) / 100;
    const totalLad = parseFloat((dailyRate * ladDays).toFixed(2));
    if (formData.ladDays !== ladDays || formData.ladAmount !== totalLad) return { ladDays, ladAmount: totalLad };
    return null;
  }
  if (formData.ladDays !== 0 && formData.ladDays !== undefined) return { ladDays: 0, ladAmount: 0 };
  return null;
}

function oldLoc(formData: Form): Form | null {
  if (formData.isLocDeductionEnabled !== false) {
    if (formData.tarikhSiapSebenar && formData.tarikhTuntutanBayaran) {
      const siapDate = new Date(formData.tarikhSiapSebenar);
      const tuntutanDate = new Date(formData.tarikhTuntutanBayaran);
      const timeDiff = tuntutanDate.getTime() - siapDate.getTime();
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const locDays = Math.max(0, dayDiff - 14);
      const totalLoC = locDays * 100.00;
      if (formData.locDays !== locDays || formData.locAmount !== totalLoC) return { locDays, locAmount: totalLoC };
      return null;
    }
    if (formData.locDays !== 0 && formData.locDays !== undefined) return { locDays: 0, locAmount: 0 };
    return null;
  }
  if (formData.locDays !== 0 || formData.locAmount !== 0) return { locDays: 0, locAmount: 0 };
  return null;
}

function oldSettlement(formData: Form): Form | null {
  const bqSum = formData.bqDataPelarasan?.reduce((acc, group) => acc + group.items.reduce((s, item) => s + (Number(item.amount) || 0), 0), 0);
  const bqSumVal = bqSum || 0;
  const hasPelarasan = formData.bqDataPelarasan && formData.bqDataPelarasan.length > 0;
  const rawAdjustedBqSum = (bqSumVal === 0 && !hasPelarasan) ? (Number(formData.kosProjek) || 0) : bqSumVal;
  const contractPrice = Number(formData.kosProjek) || 0;
  const cappedAdjustedBqSum = Math.min(rawAdjustedBqSum, contractPrice);
  const extraPrice = Math.max(0, rawAdjustedBqSum - contractPrice);
  const finalCalculatedTotal = cappedAdjustedBqSum - (Number(formData.ladAmount) || 0) - (Number(formData.locAmount) || 0) - (Number(formData.wangTahanan) || 0);
  if (Number(formData.kosSebenar) !== finalCalculatedTotal || Number(formData.bqPelarasanExtra) !== extraPrice) {
    return { kosSebenar: Math.max(0, parseFloat(finalCalculatedTotal.toFixed(2))), bqPelarasanExtra: parseFloat(extraPrice.toFixed(2)) };
  }
  return null;
}

// ---- run each chain in effect order (LAD, LoC, then settlement reads their results) ----
const FIELDS = ['ladDays', 'ladAmount', 'locDays', 'locAmount', 'kosSebenar', 'bqPelarasanExtra'] as const;
const step = (p: Form, patch: Form | null): Form => (patch ? { ...p, ...patch } : p);

function runOld(p: Form): Form { const a = step(p, oldLad(p)); const b = step(a, oldLoc(a)); return step(b, oldSettlement(b)); }
function runNew(p: Form, rules: ReturnType<typeof toPolicyRules>): Form {
  const a = step(p, ladPatch(p, ladPolicyFor(rules, p)));
  const b = step(a, locPatch(a, locPolicyFor(rules, a)));
  return step(b, settlementPatch(b));
}

const addDays = (iso: string, days: number): string => new Date(Date.parse(iso) + days * 86_400_000).toISOString().slice(0, 10);

async function getJson<T>(base: string, path: string, user: string): Promise<T> {
  const res = await fetch(`${base}/api${path}`, { headers: { 'X-InfraHub-User': user } });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

async function main(): Promise<void> {
  const [base = 'http://localhost:8795', user = '1'] = process.argv.slice(2);
  const rules = toPolicyRules(await getJson<PolicyRuleRecord[]>(base, '/policies', user));
  const list = await getJson<Project[]>(base, '/projects', user);
  let diffs = 0; let storedMismatch = 0; let withLad = 0; let withLoc = 0; let withPelarasan = 0;
  for (const row of list) {
    const p = await getJson<Project>(base, `/projects/${row.id}`, user);
    const before = runOld(p); const after = runNew(p, rules);
    if ((before.ladDays ?? 0) > 0) withLad++;
    if ((before.locDays ?? 0) > 0) withLoc++;
    if (p.bqDataPelarasan?.length) withPelarasan++;
    if (FIELDS.some((f) => Number(p[f] ?? 0) !== Number(before[f] ?? 0))) storedMismatch++;
    for (const f of FIELDS) {
      if (before[f] !== after[f]) { diffs++; console.log(`DIFF project=${p.id} field=${f} old=${before[f]} new=${after[f]}`); }
    }
  }
  console.log(`projects=${list.length} fields_compared=${list.length * FIELDS.length} diffs=${diffs}`);
  // The seed has no late claims, so also sweep synthetic delays over every real project amount.
  let sweepCases = 0; let sweepDiffs = 0;
  for (const row of list) {
    for (let k = 0; k <= 40; k += 3) {
      const p: Form = { ...row, tarikhTamatKontrak: '2026-03-02', tarikhSiapSebenar: addDays('2026-03-02', k),
        tarikhTuntutanBayaran: addDays('2026-03-02', 2 * k), isLocDeductionEnabled: k % 2 === 0, ladDays: undefined, locDays: undefined };
      const before = runOld(p); const after = runNew(p, rules);
      sweepCases++;
      if (FIELDS.some((f) => before[f] !== after[f])) { sweepDiffs++; console.log(`SWEEP DIFF project=${row.id} k=${k}`); }
    }
  }
  console.log(`synthetic_sweep_cases=${sweepCases} synthetic_sweep_diffs=${sweepDiffs}`);
  diffs += sweepDiffs;
  console.log(`projects_with_lad_days=${withLad} projects_with_loc_days=${withLoc} projects_with_pelarasan=${withPelarasan}`);
  console.log(`info: stored_values_differ_from_old_formula=${storedMismatch} (both paths recompute them identically)`);
  process.exit(diffs === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
