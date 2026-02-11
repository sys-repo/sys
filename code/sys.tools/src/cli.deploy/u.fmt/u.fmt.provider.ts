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

  const shortIdFmt = (() => {
    if (!siteId) return c.dim(c.gray('-'));

    const shortId = Str.ellipsize(siteId, [3, 4], '..');
    const suffix = siteId.slice(-4);

    if (!suffix || !shortId.endsWith(suffix)) return c.dim(c.gray(shortId));

    const prefix = shortId.slice(0, shortId.length - suffix.length);
    return `${c.dim(c.gray(prefix))}${c.white(suffix)}`;
  })();
  const value = `${c.cyan('orbiter')} siteId:${shortIdFmt}`.trimEnd();

  return { label: 'provider', value };
}
