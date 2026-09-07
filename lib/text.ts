import type { Project, ProjectLocation, BQGroup, BQItem, PresetGroup, BQTemplateDefinition, User } from '../types';

// Collapse runs of spaces/tabs into a single space and trim both ends.
export const normalizeSpaces = (value: string): string =>
  value.replace(/[ \t]+/g, ' ').trim();

// Normalize each line independently while preserving line breaks
// (e.g. Lokasi / Aduan fields are newline-separated rows).
export const normalizeSpacesMultiline = (value: string): string =>
  value.split('\n').map(normalizeSpaces).join('\n');

const cleanStr = (value: unknown, multiline = false): unknown => {
  if (typeof value !== 'string') return value;
  return multiline ? normalizeSpacesMultiline(value) : normalizeSpaces(value);
};

// --- BQ ITEMS / GROUPS ---
export const sanitizeBQItem = (item: BQItem): BQItem => {
  const next: BQItem = { ...item };
  next.description = cleanStr(next.description) as string;
  if (next.variant !== undefined) next.variant = cleanStr(next.variant) as string | undefined;
  if (next.customCalc !== undefined) next.customCalc = cleanStr(next.customCalc) as string | undefined;
  if (Array.isArray(next.calculationParts)) {
    next.calculationParts = next.calculationParts.map(part => (
      part.label !== undefined ? { ...part, label: cleanStr(part.label) as string | undefined } : part
    ));
  }
  return next;
};

export const sanitizeBQGroups = (groups?: BQGroup[]): BQGroup[] | undefined => {
  if (!Array.isArray(groups)) return groups;
  return groups.map(group => ({
    ...group,
    title: cleanStr(group.title) as string,
    items: (group.items || []).map(sanitizeBQItem),
  }));
};

// --- PROJECT ---
const PROJECT_SINGLE_LINE_FIELDS: (keyof Project)[] = [
  'namaProjek', 'namaSyarikat', 'bp', 'zon', 'mukim', 'iso', 'tempohKontrak',
  'coverJawatan', 'coverBahagian', 'coverUnit',
  'akuJanjiMonth', 'akuJanjiPanelTitle', 'akuJanjiFooterText', 'noInbois',
];
const PROJECT_MULTILINE_FIELDS: (keyof Project)[] = [
  'lokasi', 'noAduan', 'aduan', 'coverSebutHargaText',
];

export const sanitizeProject = <T extends Partial<Project>>(project: T): T => {
  if (!project || typeof project !== 'object') return project;
  const next: any = { ...project };

  PROJECT_SINGLE_LINE_FIELDS.forEach(field => {
    if (typeof next[field] === 'string') next[field] = normalizeSpaces(next[field]);
  });
  PROJECT_MULTILINE_FIELDS.forEach(field => {
    if (typeof next[field] === 'string') next[field] = normalizeSpacesMultiline(next[field]);
  });

  if (Array.isArray(next.projectLocations)) {
    next.projectLocations = next.projectLocations.map((loc: ProjectLocation) => ({
      ...loc,
      lokasi: cleanStr(loc.lokasi),
      aduan: cleanStr(loc.aduan),
    }));
  }

  next.bqData = sanitizeBQGroups(next.bqData);
  next.bqDataPelarasan = sanitizeBQGroups(next.bqDataPelarasan);
  return next as T;
};

// --- BQ LIBRARY / TEMPLATES ---
export const sanitizeLibraryGroups = (groups?: PresetGroup[]): PresetGroup[] | undefined => {
  if (!Array.isArray(groups)) return groups;
  return groups.map(group => ({
    ...group,
    title: cleanStr(group.title) as string,
    category: cleanStr(group.category) as string,
    items: (group.items || []).map(item => ({
      ...item,
      description: cleanStr(item.description) as string,
      variants: Array.isArray(item.variants)
        ? item.variants.map(v => (v.label !== undefined ? { ...v, label: cleanStr(v.label) as string } : v))
        : item.variants,
    })),
  }));
};

export const sanitizeTemplates = (templates?: BQTemplateDefinition[]): BQTemplateDefinition[] | undefined => {
  if (!Array.isArray(templates)) return templates;
  return templates.map(tpl => ({
    ...tpl,
    title: cleanStr(tpl.title) as string,
    subtitle: cleanStr(tpl.subtitle) as string,
    bills: Array.isArray(tpl.bills)
      ? tpl.bills.map(bill => ({
          ...bill,
          title: cleanStr(bill.title) as string,
          items: Array.isArray(bill.items)
            ? bill.items.map(entry => ((entry as BQItem).description !== undefined ? sanitizeBQItem(entry as BQItem) : entry))
            : bill.items,
        }))
      : tpl.bills,
  }));
};

// --- USERS ---
const USER_TEXT_FIELDS: (keyof User)[] = ['fullName', 'jawatan', 'bahagian', 'unit'];

export const sanitizeUser = <T extends Partial<User>>(user: T): T => {
  const next: any = { ...user };
  USER_TEXT_FIELDS.forEach(field => {
    if (typeof next[field] === 'string') next[field] = normalizeSpaces(next[field]);
  });
  return next as T;
};

// --- GLOBAL ON-BLUR GUARD ---
// Strictly removes extra whitespace from any plain text input/textarea when
// it loses focus. Uses the native value setter + input event so React
// controlled components pick up the normalized value.
const applyNormalizedValue = (el: HTMLInputElement | HTMLTextAreaElement, next: string) => {
  if (next === el.value) return;
  const descriptor = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value');
  if (descriptor && descriptor.set) descriptor.set.call(el, next);
  else el.value = next;
  el.dispatchEvent(new Event('input', { bubbles: true }));
};

export const installWhitespaceGuard = (): void => {
  if (typeof document === 'undefined' || (document as any).__whitespaceGuardInstalled) return;
  (document as any).__whitespaceGuardInstalled = true;

  document.addEventListener('blur', (event) => {
    const el = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el || !el.tagName) return;

    if (el.tagName === 'TEXTAREA') {
      applyNormalizedValue(el, normalizeSpacesMultiline(el.value));
    } else if (el.tagName === 'INPUT') {
      const type = (el as HTMLInputElement).type;
      // Only plain text fields; number/date/email/password/checkbox etc. untouched.
      if (type && type !== 'text') return;
      applyNormalizedValue(el, normalizeSpaces(el.value));
    }
  }, true);
};
