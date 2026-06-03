import { type t, c, Str } from '../common.ts';

export function fmtProviderOrbiter(p: t.DeployTool.Config.Provider.Orbiter): t.ProviderFmt {
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
