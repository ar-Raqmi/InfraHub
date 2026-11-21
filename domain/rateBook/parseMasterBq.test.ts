import { describe, expect, it } from 'vitest';
import fixture from './__fixtures__/mini-master-bq.json';
import { parseMasterBq } from './parseMasterBq';
import type { SheetRows } from './types';

const sheets = fixture as SheetRows[];
const JAB = 'KADAR HARGA JABATAN (RM)';
const KON = 'KADAR HARGA KONTRAKTOR (RM)';

describe('parseMasterBq on the synthetic KESELURUHAN sheet', () => {
  const book = parseMasterBq(sheets, { sheets: ['KESELURUHAN'] });
  const bill = (no: string) => book.bills.find((b) => b.no === no)!;
  const group = (billNo: string, code: string) => bill(billNo).groups.find((g) => g.code === code)!;
  const item = (billNo: string, code: string) => bill(billNo).groups.flatMap((g) => g.items).find((i) => i.code === code)!;

  it('reads the title row and keeps both rate column headers', () => {
    expect(book.sheets[0].title).toBe('JADUAL KADAR HARGA 2024/2025');
    expect(book.rateColumns).toEqual([JAB, KON]);
  });

  it('merges (SAMBUNGAN) pages into their bill', () => {
    expect(book.bills.map((b) => `${b.no}:${b.title}`)).toEqual(['1:KERJA-KERJA PERMULAAN', '2:BUTIRAN KERJA LONGKANG']);
    expect(bill('1').groups.map((g) => g.code)).toEqual(['1', '2', '4']);
  });

  it('counts groups, items, variants and priced rows', () => {
    expect(book.stats).toMatchObject({ bills: 2, groups: 9, items: 12, variants: 13, pricedRows: 18 });
  });

  it('carries a description wrapped over several rows and a variant label continued on an indented row', () => {
    const insurance = item('1', '1');
    expect(insurance.description).toBe('Menyediakan polisi insuran berikut bagi merangkumi tempoh pekerjaan seperti insuran tanggungan awam.');
    expect(insurance.variants.map((v) => v.label)).toEqual([
      'Bagi nilai kerja yang kurang RM 25,000.00.',
      'Bagi nilai kerja diantara RM25,000.00 hingga RM 50,000.00. Liputan adalah RM 25,000.00',
    ]);
    expect(insurance.variants[1]).toMatchObject({ code: '1(ii)', unit: 'L/S', rates: { [JAB]: 600, [KON]: 510 } });
    expect(insurance.notes).toEqual(['Bagi perkara di atas, Kontraktor adalah dikehendaki mengemukakan Nota']);
  });

  it('takes the rate from the first description line, including formatted text cells', () => {
    expect(item('1', '2.1')).toMatchObject({ unit: 'L/S', rates: { [JAB]: 1500, [KON]: 1275 } });
    expect(item('1', '2.1').description).toBe('Membekal dan menyediakan jentera alat pengangkutan pekerja, papan tanda lalu lintas sementara.');
    expect(item('1', '4.1')).toMatchObject({ description: 'KERJA-KERJA PENGUKURAN AWAL Kerja-kerja pengukuran dan pemantauan tapak di sepanjang jajaran longkang melibatkan pengukuran struktur sedia ada.', unit: 'M2', rates: { [KON]: 0.85 } });
  });

  it('reads variant markers i) a) ii. i.)', () => {
    expect(item('1', '2.2').variants.map((v) => v.code)).toEqual(['2.2(i)', '2.2(ii)']);
    expect(item('2', '1.1').variants.map((v) => v.label)).toEqual(['Dengan jentera', 'Dengan tangan']);
    expect(item('2', '1.2').variants.map((v) => v.code)).toEqual(['1.2(a)', '1.2(b)']);
  });

  it('creates unnumbered items under a group and after a variant list', () => {
    expect(group('2', '2').items.map((i) => [i.code, i.rates?.[KON]])).toEqual([['2', 27.35]]);
    expect(group('2', '15').items.map((i) => [i.code, i.variants.length, i.rates?.[KON] ?? null])).toEqual([['15', 2, null], ['15-2', 0, 28.54]]);
    expect(group('2', '15').items[1].description).toBe('Kerja-kerja melepa menggunakan simen dan pasir (1:3) berketebalan 25mm.');
  });

  it('treats a priced level-1 row as both group and item', () => {
    expect(group('2', '17').items[0]).toMatchObject({ code: '17', unit: 'M3', rates: { [KON]: 26.3 } });
    expect(group('2', '17').items[0].description).toBe('Kerja-kerja membekal dan menimbus tanah di kedua-dua belah tembok longkang serta kerja memadat.');
  });

  it('keeps nota lines as notes and warns with sheet and row number', () => {
    expect(item('2', '8').notes).toEqual(['nota : Perlulah mendapatkan daripada pembekal yang mempunyai PCL Certificate License.']);
    expect(book.warnings).toEqual([
      { sheet: 'KESELURUHAN', row: 43, message: expect.stringContaining('tiada kadar') },
      { sheet: 'KESELURUHAN', row: 56, message: expect.stringContaining('tiada unit') },
    ]);
  });
});

describe('parseMasterBq on a category sheet', () => {
  const book = parseMasterBq(sheets, { sheets: ['PERHENTIAN BAS'] });

  it('accepts BILL NO. and a single rate column', () => {
    expect(book.rateColumns).toEqual([JAB]);
    expect(book.bills[0]).toMatchObject({ no: '14', title: 'BUTIRAN KERJA PERHENTIAN BAS' });
    expect(book.stats).toMatchObject({ groups: 2, items: 2, variants: 2, pricedRows: 3, warnings: 0 });
  });

  it('appends unpriced lettered spec lines to a priced description', () => {
    const it0 = book.bills[0].groups[0].items[0];
    expect(it0.description).toBe('Kerja-kerja membekal dan memasang papan tanda baru nama jalan berikut :- (a.) Board - 3.2mm thick Fibre Board (b.) Board Size - 1000mm x 270mm (Blue)');
    expect(it0.variants).toEqual([]);
  });

  it('continues a variant label on an indented line', () => {
    const v = book.bills[0].groups[1].items[0].variants[0];
    expect(v).toMatchObject({ code: '2.1(iii)', label: 'Lot tempat meletak kenderaan & Nombor petak parking (sila rujuk spesifikasi pelan)', unit: 'Nos' });
  });
});

describe('parseMasterBq with every sheet', () => {
  it('parses both sheets and sums their stats', () => {
    const book = parseMasterBq(sheets);
    expect(book.sheets.map((s) => s.name)).toEqual(['KESELURUHAN', 'PERHENTIAN BAS']);
    expect(book.stats.pricedRows).toBe(21);
  });
});
