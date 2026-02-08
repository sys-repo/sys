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

  const shortId = siteId ? Str.ellipsize(siteId, [3, 4], '..') : '-';
  const shortIdFmt =
    siteId && shortId.includes('..')
      ? `${c.gray(shortId.slice(0, -4))}${c.white(shortId.slice(-4))}`
      : c.gray(shortId);
  const value = `${c.cyan('orbiter')} siteId:${shortIdFmt}`.trimEnd();

  return { label: 'provider', value };
}
