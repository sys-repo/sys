import { type t } from '../common.ts';

/**
 * Determines if currently running within a browser environment
 * (excluding Deno's web-like runtime).
 */
export function browser() {
  const g = globalThis as any;

  // When mocked/virtual-dom return `true` (we are a browser).
  // See: `DomMock`
  if (!!g.__SYS_BROWSER_MOCK__) return true;

  // Real browser (or worker).
  const hasNavigator = typeof g.navigator === 'object' && typeof g.navigator.userAgent === 'string';

  // Deno (exclude, which looks superficially like a browser).
  const isDeno = typeof g.Deno === 'object' && g.Deno?.version?.deno;
  return hasNavigator && !isDeno;
}
