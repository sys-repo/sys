import { c, Str, type t, Url } from '../common.ts';

type ServiceUrlBaseScore = readonly [
  depth: number,
  pathLength: number,
  searchLength: number,
  hashLength: number,
  hrefLength: number,
];

/** CLI formatting helpers for service URLs. */
export const UrlFmt: t.CliFormat.Lib['Url'] = {
  service(url, options = {}) {
    const origin = options.highlightOrigin ? c.cyan : c.gray;
    const parsed = Url.parse(url.href);
    if (!parsed.ok) return origin(url.href);

    const value = parsed.toURL();
    const suffix = `${value.pathname}${value.search}${value.hash}` || '/';
    return `${origin(value.origin)}${c.gray(suffix)}`;
  },

  orderBaseLast(urls) {
    const baseIndex = mostBaseUrlIndex(urls);
    if (baseIndex < 0 || baseIndex === urls.length - 1) return urls;

    const ordered = [...urls];
    const [base] = ordered.splice(baseIndex, 1);
    ordered.push(base);
    return ordered;
  },
};

/**
 * Helpers:
 */
function mostBaseUrlIndex(urls: readonly t.Service.Url[]): number {
  let best: { readonly index: number; readonly score: ServiceUrlBaseScore } | undefined;
  urls.forEach((url, index) => {
    const score = serviceUrlBaseScore(url);
    if (!score) return;
    if (!best || compareScore(score, best.score) < 0) best = { index, score };
  });
  return best?.index ?? urls.length - 1;
}

function serviceUrlBaseScore(url: t.Service.Url): ServiceUrlBaseScore | undefined {
  const parsed = Url.parse(url.href);
  if (!parsed.ok) return;

  const value = parsed.toURL();
  const pathname = Str.trimTrailingSlashes(value.pathname) || '/';
  return [
    pathDepth(pathname),
    pathname.length,
    value.search.length,
    value.hash.length,
    value.href.length,
  ];
}

function compareScore(a: readonly number[], b: readonly number[]): number {
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) {
    const diff = a[i] - b[i];
    if (diff !== 0) return diff;
  }
  return a.length - b.length;
}

function pathDepth(pathname: string): number {
  if (pathname === '/') return 0;
  return Str.splitPathSegments(pathname).length;
}
