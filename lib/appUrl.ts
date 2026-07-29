function addQuery(base: string, params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export const PageUrl = {
  index: '/index.html',
  login: '/login.html',
  dashboard: (year?: number) => addQuery('/dashboard.html', { year }),
  projects: (year?: number) => addQuery('/projects.html', { year }),
  project: (id: number, year?: number) => addQuery('/project.html', { id, year }),
  users: '/users.html',
  report: (year?: number) => addQuery('/report.html', { year }),
  profile: '/profile.html',
  settings: (year?: number) => addQuery('/settings.html', { year }),
};

export function getQueryParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

export function getQueryNumber(name: string): number | undefined {
  const raw = getQueryParam(name);
  if (raw === null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}
