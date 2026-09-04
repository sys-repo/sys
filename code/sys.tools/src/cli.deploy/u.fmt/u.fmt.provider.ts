import { c, type t } from '../common.ts';
import { fmtProviderR2 } from '../u.providers/provider.r2/u.fmt.ts';

export function fmtProvider(
  provider?: t.DeployTool.Config.Provider.All,
): t.ProviderFmt | undefined {
  const label = 'provider';
  if (!provider) return { label, value: c.gray('-') };

  switch (provider.kind) {
    case 'noop':
      return { label: 'provider', value: c.white('noop') };

    case 'r2':
      return fmtProviderR2(provider);

    default: {
      // Future providers: keep a stable, non-throwing default.
      const kind = (provider as { readonly kind?: unknown }).kind;
      return { label, value: c.gray(String(kind ?? 'unknown')) };
    }
  }
}
