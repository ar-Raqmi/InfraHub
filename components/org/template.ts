// Printed texts are templates with {{placeholder}} slots. Unknown placeholders stay visible on purpose,
// so a typo in Tetapan shows up in the preview instead of silently printing nothing.

export type TemplateVars = Record<string, string | number | null | undefined>;

export interface TextToken {
  text: string;
  /** True for a filled placeholder: documents that emphasise values print these in bold. */
  bold: boolean;
}

const SLOT = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;

const valueOf = (vars: TemplateVars, name: string, raw: string): string => {
  const v = vars[name];
  return v === undefined || v === null ? raw : String(v);
};

export function fillTemplate(template: string, vars: TemplateVars): string {
  return template.replace(SLOT, (raw, name: string) => valueOf(vars, name, raw));
}

export function templateTokens(template: string, vars: TemplateVars): TextToken[] {
  const tokens: TextToken[] = [];
  let last = 0;
  for (const match of template.matchAll(SLOT)) {
    const at = match.index ?? 0;
    if (at > last) tokens.push({ text: template.slice(last, at), bold: false });
    tokens.push({ text: valueOf(vars, match[1], match[0]), bold: true });
    last = at + match[0].length;
  }
  if (last < template.length) tokens.push({ text: template.slice(last), bold: false });
  return tokens;
}

export function placeholdersIn(template: string): string[] {
  return [...new Set([...template.matchAll(SLOT)].map((m) => m[1]))];
}
