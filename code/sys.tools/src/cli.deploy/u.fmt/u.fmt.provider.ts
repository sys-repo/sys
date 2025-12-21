import { type t, c, Str } from '../common.ts';

export function fmtProvider(
  provider?: t.DeployTool.Config.Provider.All,
): t.ProviderFmt | undefined {
  const label = 'provider';
  if (!provider) return { label, value: c.gray('-') };

  switch (provider.kind) {
    case 'orbiter':
      return fmtProviderOrbiter(provider);

    case 'noop':
      return { label: 'provider', value: c.white('noop') };

    default: {
      // Future providers: keep a stable, non-throwing default.
      const kind = (provider as { readonly kind?: unknown }).kind;
      return { label, value: c.gray(String(kind ?? 'unknown')) };
    }
  }
}

function fmtProviderOrbiter(p: t.DeployTool.Config.Provider.Orbiter): t.ProviderFmt {
  const siteId = String(p.siteId ?? '');
  const domain = String(p.domain ?? '');

  const shortId = siteId ? Str.ellipsize(siteId, [3, 4], '..') : '-';
  const parts: string[] = [];
  if (domain) parts.push(`domain=${c.white(domain)}`);

  const rhs = parts.length ? c.gray(`(${parts.join(', ')})`) : '';
  const value = `${c.cyan('orbiter')} siteId:${c.gray(shortId)} ${rhs}`.trimEnd();

  return { label: 'provider', value };
}
