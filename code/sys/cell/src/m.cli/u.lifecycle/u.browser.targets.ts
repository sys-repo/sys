import { Is, type t, Url } from '../common.ts';

type Selector = {
  readonly service: t.Cell.Id;
  readonly pathname: t.StringUrlRoute;
};

type Source = {
  readonly service: t.Cell.Id;
  readonly pathnames: t.Cell.Services.Service['browser'];
  readonly urls: readonly t.Service.Url[] | undefined;
};

export type BrowserTargets = {
  readonly targets: readonly (Selector & { readonly href: t.StringUrl })[];
  readonly diagnostics: readonly (Selector & { readonly matches: number })[];
};

type BrowserSelection = {
  readonly browser: BrowserTargets;
  readonly selected: ReadonlyMap<t.Cell.Id, ReadonlySet<t.StringUrl>>;
};

/** Resolve from captured hrefs; retain service-local matches separately from deduplicated handoffs. */
export function resolveBrowserTargets(sources: readonly Source[]): BrowserSelection {
  const targets: BrowserTargets['targets'][number][] = [];
  const diagnostics: BrowserTargets['diagnostics'][number][] = [];
  const selected = new Map<t.Cell.Id, Set<t.StringUrl>>();
  const seen = new Set<t.StringUrl>();

  for (const { service, pathnames, urls } of sources) {
    if (pathnames === undefined) continue;
    const selectors = Is.str(pathnames) ? [pathnames] : pathnames;
    const published = new Map<t.StringUrlRoute, Set<t.StringUrl>>();
    for (const { href } of urls ?? []) {
      const url = browserUrl(href);
      if (!url) continue;
      const matches = published.get(url.pathname) ?? new Set<t.StringUrl>();
      matches.add(url.href);
      published.set(url.pathname, matches);
    }

    for (const pathname of selectors) {
      const matches = published.get(pathname);
      if (!matches || matches.size !== 1) {
        diagnostics.push({ service, pathname, matches: matches?.size ?? 0 });
        continue;
      }
      for (const href of matches) {
        const local = selected.get(service) ?? new Set<t.StringUrl>();
        local.add(href);
        selected.set(service, local);
        if (seen.has(href)) continue;
        seen.add(href);
        targets.push({ service, pathname, href });
      }
    }
  }

  return { browser: { targets, diagnostics }, selected };
}

function browserUrl(href: t.StringUrl): URL | undefined {
  // Reject controls before URL parsing can trim or normalize them away.
  for (const character of href) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) return undefined;
  }
  const parsed = Url.parse(href);
  if (!parsed.ok) return undefined;
  const url = parsed.toURL();
  if (url.username || url.password) return undefined;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
  return url;
}
