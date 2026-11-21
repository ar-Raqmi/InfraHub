import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Camera, ChevronLeft, Copy, FileSpreadsheet, FolderOpen, HardHat, Plus, Ruler, Search, Upload } from 'lucide-react';
import { ProjectStatus } from '../types';
import {
  Button, Card, Chip, ContractChip, DataTable, DiffRow, EmptyState, Field, IconButton, Indicator, Input,
  SectionHeader, Select, Sheet, StatTile, StatusPill, Tabs, Timeline, WorkflowStepper, STATUS_ORDER,
} from '../components/ui';
import type { Column, IndicatorState, TimelineItem } from '../components/ui';
import { Formatter } from '../services/Formatter';

// Dev-only gallery of components/ui. All names and figures are invented.

const SWATCHES = [
  ['paper', '#F7F5EF'], ['paper-deep', '#EFEBE1'], ['surface', '#FFFFFF'], ['line', '#E3DFD3'],
  ['muted', '#5B6B68'], ['ink', '#14211F'], ['emerald', '#059669'], ['emerald-bright', '#10B981'],
  ['teal', '#14B8A6'], ['kontrak', '#3B2E8C'], ['amber', '#B45309'], ['danger', '#B42318'],
];

interface BqRow { code: string; desc: string; unit: string; qty: number; rate: number; flag?: IndicatorState }

const BQ_ROWS: BqRow[] = [
  { code: '2.1(i)', desc: 'Longkang U-shape pracetak 600 mm', unit: 'm', qty: 42.5, rate: 510 },
  { code: '2.3', desc: 'Konkrit gred 20 (1:2:4), asas tiang', unit: 'm³', qty: 2.4, rate: 420, flag: 'KADAR_BERUBAH' },
  { code: '4.2(ii)', desc: 'Premix ACW14 50 mm, termasuk tack coat', unit: 'm²', qty: 180, rate: 28.5, flag: 'PERKATAAN_BERUBAH' },
  { code: '7.4', desc: 'Pagar railing keluli tergalvani 1.2 m', unit: 'm', qty: 24, rate: 185, flag: 'TIADA' },
];

const BQ_COLUMNS: Column<BqRow>[] = [
  { key: 'code', header: 'Item', render: r => <span className="font-bold text-kontrak ih-num">{r.code}</span> },
  {
    key: 'desc', header: 'Keterangan', render: r => (
      <span className="flex items-start gap-2 min-w-[220px]">
        {r.flag && <Indicator state={r.flag} variant="dot" className="mt-1.5" />}
        <span>{r.desc}</span>
      </span>
    ),
  },
  { key: 'unit', header: 'Unit', align: 'center', render: r => r.unit },
  { key: 'qty', header: 'Kuantiti', numeric: true, render: r => r.qty.toFixed(2) },
  { key: 'rate', header: 'Kadar', numeric: true, render: r => Formatter.formatCurrency(r.rate) },
  { key: 'amt', header: 'Amaun', numeric: true, render: r => <strong>{Formatter.formatCurrency(r.qty * r.rate)}</strong> },
];

const VERSIONS: TimelineItem[] = [
  { id: 'v3', tag: 'v3', tone: 'kontrak', title: 'Kadar 2026 diterbitkan', at: '12.02.26, 10:42', actor: 'pt01', body: '4 kadar dikemas kini (konkrit, cat, U-drain, premix). 462 projek kekal pada v2 sehingga dipindah.' },
  { id: 'v2', tag: 'v2', tone: 'amber', title: '12 kadar dikemas kini', at: '15.01.26, 16:08', actor: 'pt01', body: '23 projek draf ditanda "kadar berubah".' },
  { id: 'v1', tag: 'v1', tone: 'neutral', title: 'Import daripada Pustaka asal', at: '01.01.26, 08:30', actor: 'sistem', body: '197 kumpulan, 1,204 item.' },
];

const Section: React.FC<{ id: string; title: string; note: string; children: React.ReactNode }> = ({ id, title, note, children }) => (
  <section id={id} className="py-10 md:py-14 border-t border-line">
    <SectionHeader title={title} description={note} eyebrow={<><span className="w-1.5 h-1.5 rounded-full bg-emerald-bright" />{id}</>} className="mb-6" />
    {children}
  </section>
);

const Tokens: React.FC = () => (
  <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
    <Card padding="lg">
      <p className="ih-eyebrow text-muted mb-3">Bricolage Grotesque · paparan</p>
      <p className="font-display text-display-xl text-ink">Rabu, 14 April</p>
      <p className="font-display text-display-l text-ink mt-3">Kontrak &amp; buku kadar</p>
      <p className="font-display text-display-m text-ink mt-3">Longkang U-shape, Jalan Mawar 3</p>
      <p className="ih-eyebrow text-muted mt-8 mb-3">Atkinson Hyperlegible Next · teks &amp; angka</p>
      <p className="text-base text-ink max-w-prose">Giliran anda: ukur 6 item untuk BQ Pelarasan. Kerja disimpan dalam telefon dan dihantar apabila ada isyarat.</p>
      <p className="font-display font-bold text-[2rem] ih-num text-ink mt-4 tracking-tight">RM 21,675.00 · 0123456789</p>
    </Card>
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 content-start">
      {SWATCHES.map(([name, hex]) => (
        <div key={name} className="bg-surface border border-line rounded-ih-md p-2">
          <span className="block h-12 rounded-ih-sm border border-line" style={{ background: hex }} />
          <span className="block text-xs font-bold text-ink mt-2 truncate">{name}</span>
          <span className="block text-[11px] text-muted ih-num">{hex}</span>
        </div>
      ))}
    </div>
  </div>
);

const Buttons: React.FC = () => (
  <div className="grid gap-6 lg:grid-cols-2">
    <Card className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button icon={Plus}>Projek baharu</Button>
        <Button variant="ink">Sahkan kadar baharu</Button>
        <Button variant="outline">Kekal kadar</Button>
        <Button variant="ghost">Batal</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="kontrak" icon={Copy}>Klon kontrak</Button>
        <Button variant="outline" icon={Upload}>Import Excel</Button>
        <Button variant="danger">Tutup kontrak</Button>
        <Button size="sm" variant="outline">Ingatkan</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <IconButton icon={ChevronLeft} label="Kembali" variant="outline" />
        <IconButton icon={Search} label="Cari projek" />
        <IconButton icon={Camera} label="Ambil foto" variant="ink" />
        <Button disabled>Simpan (tiada perubahan)</Button>
      </div>
    </Card>
    <Card variant="ink" padding="lg">
      <p className="ih-eyebrow text-emerald-bright">Seterusnya · Pemeriksaan tapak</p>
      <p className="font-display font-bold text-[1.5rem] leading-tight mt-2">Longkang U-shape, Jalan Mawar 3</p>
      <p className="text-paper/70 text-sm mt-1">Syarikat A Enterprise · 6 item untuk diukur</p>
      <Button size="lg" icon={Ruler} block className="mt-5">Mula ukur</Button>
    </Card>
    <Card className="space-y-2 lg:col-span-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
      <Button size="lg" variant="outline" block hint="Jika kerja dilantik sebelum 31 Dis 2026">Kekal kadar kontrak</Button>
      <Button size="lg" variant="ink" block hint="Jika lantikan di bawah kontrak 2027 · PT akan sahkan">Guna kadar baharu</Button>
    </Card>
  </div>
);

const Chips: React.FC = () => (
  <div className="grid gap-6 lg:grid-cols-2">
    <Card className="space-y-4">
      <p className="ih-eyebrow text-muted">ContractChip · kecil</p>
      <div className="flex flex-wrap gap-2">
        <ContractChip code="MPS/SH/302/25" status="AKTIF" />
        <ContractChip code="MPS/SH/118/26" status="DRAF" />
        <ContractChip code="MPS/SH/25/25" status="DITUTUP" />
        <ContractChip code="MPS/SH/302/25" status="AKTIF" locked />
      </div>
      <p className="ih-eyebrow text-muted pt-2">Chip · nada</p>
      <div className="flex flex-wrap gap-2">
        <Chip dot>Draf</Chip>
        <Chip tone="emerald" dot>Disegerak</Chip>
        <Chip tone="teal">2 tapak hari ini</Chip>
        <Chip tone="kontrak">Kadar 2026 v3</Chip>
        <Chip tone="amber" dot>Lewat 1 hari</Chip>
        <Chip tone="danger" dot>Foto tiada</Chip>
      </div>
    </Card>
    <Card className="space-y-3">
      <p className="ih-eyebrow text-muted">ContractChip · besar</p>
      <ContractChip size="lg" code="MPS/SH/302/25" status="AKTIF" book="Kadar 2026 v3" meta="Dikunci 12 Mac · 31 item" locked />
      <ContractChip size="lg" code="MPS/SH/118/26" status="DRAF" book="Kadar 2027" meta="Belum boleh dipilih · sah dari 01.01.27" />
      <ContractChip size="lg" code="MPS/SH/25/25" status="DITUTUP" book="Kadar 2025" meta="Ditutup 31.12.25 · 4 projek" />
    </Card>
  </div>
);

const Workflow: React.FC = () => (
  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
    <Card>
      <p className="ih-eyebrow text-muted mb-4">WorkflowStepper · menegak (telefon)</p>
      <WorkflowStepper
        current={ProjectStatus.PEMERIKSAAN_TAPAK}
        notes={{ FASA_DRAF: '2 Mac', MENUNGGU_LANTIKAN: '12 Mac', DALAM_PROSES: '21 Mac', PEMERIKSAAN_TAPAK: 'hari ini', TUNTUTAN_BAYARAN: 'PT', SIAP: 'PT' }}
      >
        <Card variant="ink" padding="md">
          <p className="text-[15px]">Giliran anda: ukur 6 item untuk BQ Pelarasan. 2 sudah siap.</p>
          <div className="h-1.5 rounded-full bg-paper/15 mt-3"><div className="h-full w-1/3 rounded-full bg-emerald-bright" /></div>
          <Button icon={Ruler} block className="mt-4">Sambung ukur · item 3</Button>
        </Card>
      </WorkflowStepper>
    </Card>
    <div className="space-y-6 min-w-0">
      <Card className="hidden md:block">
        <p className="ih-eyebrow text-muted mb-4">WorkflowStepper · mendatar (desktop sahaja)</p>
        <WorkflowStepper orientation="horizontal" current={ProjectStatus.PEMERIKSAAN_TAPAK} notes={{ FASA_DRAF: '02.03', MENUNGGU_LANTIKAN: '12.03', DALAM_PROSES: '21.03', PEMERIKSAAN_TAPAK: 'hari ini' }} />
        <div className="border-t border-line my-5" />
        <WorkflowStepper orientation="horizontal" current={ProjectStatus.SIAP} />
      </Card>
      <Card>
        <p className="ih-eyebrow text-muted mb-4">StatusPill · enam status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map(s => <StatusPill key={s} status={s} />)}
        </div>
      </Card>
    </div>
  </div>
);

const Stats: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
    <StatTile value={29} label="Draf" />
    <StatTile value={34} label="Menunggu Lantikan" hint="19 hari purata" tone="amber" />
    <StatTile value={53} label="Dalam Proses" />
    <StatTile value={32} label="Pemeriksaan Tapak" tone="emerald" />
    <StatTile value={46} label="Tuntutan Bayaran" hint="21 lewat" tone="amber" onClick={() => undefined} />
    <StatTile value={291} label="Siap" />
  </div>
);

const RateChanges: React.FC = () => (
  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
    <Card className="space-y-3">
      <p className="ih-eyebrow text-muted">Indicator · cip</p>
      <div className="flex flex-col items-start gap-2">
        <Indicator state="KADAR_BERUBAH" detail="1 daripada 2" />
        <Indicator state="PERKATAAN_BERUBAH" />
        <Indicator state="TIADA" />
      </div>
      <p className="ih-eyebrow text-muted pt-2">Indicator · titik dalam baris</p>
      <div className="flex items-center gap-4 text-sm text-ink">
        <span className="flex items-center gap-2"><Indicator state="KADAR_BERUBAH" variant="dot" />kadar</span>
        <span className="flex items-center gap-2"><Indicator state="PERKATAAN_BERUBAH" variant="dot" />perkataan</span>
        <span className="flex items-center gap-2"><Indicator state="TIADA" variant="dot" />tiada</span>
      </div>
    </Card>
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <p className="ih-eyebrow text-muted">DiffRow · Kadar 2026 v2 → v3</p>
        <ContractChip code="MPS/SH/302/25" status="AKTIF" />
      </div>
      <DiffRow code="3.2" description="Cat garisan jalan termoplastik putih 100 mm" unit="m" oldRate={22} newRate={24.9} />
      <DiffRow code="2.3" description="Konkrit gred 20 (1:2:4), asas tiang" unit="m³" oldRate={420} newRate={455} />
      <DiffRow code="4.2(ii)" oldDescription="Premix ACW14 50 mm" description="Premix ACW14 50 mm, termasuk tack coat" unit="m²" oldRate={28.5} newRate={28.5} />
      <DiffRow code="5.1" description="Kerb konkrit pracetak 300 mm" unit="m" oldRate={64} newRate={58.4} />
      <DiffRow code="7.9" description="Penghadang jalan plastik berisi air" unit="buah" oldRate={null} newRate={145} />
      <DiffRow code="7.4" description="Pagar railing keluli tergalvani 1.2 m" unit="m" oldRate={185} newRate={null} />
    </Card>
  </div>
);

const Forms: React.FC = () => {
  const [tab, setTab] = useState('aktif');
  return (
    <div className="grid gap-6 lg:grid-cols-2 items-start">
      <Card padding="lg" className="space-y-4">
        <SectionHeader title="Klon kontrak" description="Sumber: MPS/SH/302/25 v3" />
        <Field label="No. sebutharga" htmlFor="kit-code" required><Input id="kit-code" defaultValue="MPS/SH/118/26" /></Field>
        <Field label="Nama buku kadar" htmlFor="kit-book"><Input id="kit-book" defaultValue="Kadar 2027" /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Sah dari" htmlFor="kit-from" hint="Tidak terikat pada tahun kalendar"><Input id="kit-from" type="date" defaultValue="2027-01-01" /></Field>
          <Field label="Had syarikat" htmlFor="kit-cap" error="Masukkan nilai lebih daripada RM 0"><Input id="kit-cap" inputMode="decimal" suffix="RM" defaultValue="0" invalid /></Field>
        </div>
        <Field label="Status awal" htmlFor="kit-status">
          <Select id="kit-status" defaultValue="DRAF"><option value="DRAF">Draf · belum boleh dipilih</option><option value="AKTIF">Aktif</option></Select>
        </Field>
        <Button variant="kontrak" icon={Copy} block>Klon 196 item sebagai draf</Button>
      </Card>
      <div className="space-y-6 min-w-0">
        <Card className="space-y-4">
          <p className="ih-eyebrow text-muted">Tabs</p>
          <Tabs label="Kontrak" value={tab} onChange={setTab} items={[{ id: 'aktif', label: 'Aktif', count: 1 }, { id: 'draf', label: 'Draf', count: 1 }, { id: 'ditutup', label: 'Ditutup', count: 3 }]} />
          <p className="ih-eyebrow text-muted pt-2">Timeline · versi Kadar 2026</p>
          <Timeline items={VERSIONS} />
        </Card>
        <EmptyState icon={FolderOpen} title="Tiada projek draf" body="Projek pada kontrak ini sudah dilantik. Draf baharu akan muncul di sini." action={<Button variant="outline" icon={Plus}>Projek baharu</Button>} />
      </div>
    </div>
  );
};

const SheetDemo: React.FC = () => {
  const [open, setOpen] = useState(new URLSearchParams(window.location.search).has('sheet'));
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="font-bold text-ink">Sheet (BottomSheet)</p>
        <p className="text-sm text-muted">Keputusan kadar sebagai dua pilihan besar.</p>
      </div>
      <Button variant="outline" onClick={() => setOpen(true)}>Buka contoh</Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Konkrit gred 20 (1:2:4), asas tiang"
        lead={<Indicator state="KADAR_BERUBAH" detail="1 daripada 2" />}
        footer={<p className="text-center text-[13px] text-muted">Keputusan direkod dengan nama dan tarikh anda</p>}
      >
        <p className="text-sm text-muted">2.40 m³ · BQ ini dibuka di bawah Kadar 2026 v2. Kontrak baharu MPS/SH/118/26 aktif 1 Jan 2027.</p>
        <div className="grid grid-cols-2 gap-2 my-4">
          <div className="border border-line rounded-ih-md p-3"><p className="text-xs text-muted">Kadar kontrak</p><p className="font-display font-extrabold text-2xl ih-num">RM 420</p><p className="text-xs text-muted ih-num">= RM 1,008.00</p></div>
          <div className="border border-amber-line bg-amber-tint rounded-ih-md p-3"><p className="text-xs text-amber">Kadar baharu</p><p className="font-display font-extrabold text-2xl ih-num">RM 455</p><p className="text-xs text-amber ih-num">= RM 1,092.00 · +8.3%</p></div>
        </div>
        <div className="space-y-2">
          <Button size="lg" variant="outline" block hint="Jika kerja dilantik sebelum 31 Dis 2026" onClick={() => setOpen(false)}>Kekal kadar kontrak</Button>
          <Button size="lg" variant="ink" block hint="Jika lantikan di bawah kontrak 2027 · PT akan sahkan" onClick={() => setOpen(false)}>Guna kadar baharu</Button>
        </div>
      </Sheet>
    </Card>
  );
};

const Kit: React.FC = () => (
  <div className="min-h-screen bg-paper text-ink overflow-x-clip">
    <header className="ih-grid-paper border-b border-line">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8 pt-10 pb-10 md:pt-16 md:pb-14">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 rounded-ih-md bg-emerald-bright text-ink flex items-center justify-center" aria-hidden><HardHat className="w-5 h-5" strokeWidth={2.25} /></span>
          <span className="font-display font-extrabold text-lg tracking-tight">InfraHub</span>
          <ContractChip code="MPS/SH/302/25" status="AKTIF" className="ml-auto" />
        </div>
        <p className="ih-eyebrow text-emerald-deep">Arah C · Tapak · mod cerah sahaja</p>
        <h1 className="font-display text-[2.5rem] md:text-[4rem] leading-[1.02] font-extrabold tracking-[-0.03em] mt-2 max-w-3xl">Kit reka bentuk untuk kerja di tapak.</h1>
        <p className="text-muted text-base md:text-lg mt-4 max-w-2xl">Setiap komponen dalam <code className="text-ink font-bold">components/ui</code> dengan data contoh. Ungu = kontrak, hijau = tindakan, ambar = kadar lapuk, merah = tiada.</p>
      </div>
    </header>
    <main className="max-w-[1240px] mx-auto px-4 sm:px-8 pb-24">
      <Section id="token" title="Warna & taip" note="Kertas tapak yang hangat, dakwat gelap, satu warna untuk setiap makna."><Tokens /></Section>
      <Section id="butang" title="Butang" note="Sasaran sentuh sekurang-kurangnya 44 px. Satu tindakan utama setiap skrin."><Buttons /></Section>
      <Section id="kontrak" title="Cip & kontrak" note="ContractChip sentiasa ungu: kod + status DRAF / AKTIF / DITUTUP."><Chips /></Section>
      <Section id="aliran" title="Aliran kerja" note="Enam status projek; langkah semasa membawa kad giliran anda."><Workflow /></Section>
      <Section id="angka" title="Kiraan" note="StatTile: angka paparan dengan digit jadual."><Stats /></Section>
      <Section id="kadar" title="Perubahan kadar" note="Indicator untuk baris BQ lapuk; DiffRow untuk lama → baharu."><RateChanges /></Section>
      <Section id="jadual" title="Jadual BQ" note="DataTable menatal dalam bingkainya sendiri; halaman tidak melebar.">
        <DataTable caption="Contoh BQ" columns={BQ_COLUMNS} rows={BQ_ROWS} rowKey={r => r.code} />
      </Section>
      <Section id="borang" title="Borang, tab & sejarah" note="Input 16 px pada telefon. Ralat dalam merah di bawah medan."><Forms /></Section>
      <Section id="lembaran" title="Lembaran" note="Sheet membalut BottomSheet: portal, Esc, butang tutup 44 px."><SheetDemo /></Section>
      <Section id="kosong" title="Fail kosong" note="EmptyState dengan satu tindakan.">
        <EmptyState icon={FileSpreadsheet} title="Belum ada buku kadar" body="Muat naik Excel BQ induk untuk mencipta versi pertama kontrak ini." action={<Button variant="kontrak" icon={Upload}>Import Excel</Button>} />
      </Section>
    </main>
  </div>
);

const rootEl = document.getElementById('root');
if (rootEl) createRoot(rootEl).render(<Kit />);
