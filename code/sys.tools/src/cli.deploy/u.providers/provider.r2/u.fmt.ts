import { type t, c } from '../common.ts';

export function fmtProviderR2(p: t.DeployTool.Config.Provider.R2): t.ProviderFmt {
  const bucket = String(p.bucket ?? '').trim() || '-';
  const prefix = String(p.prefix ?? '').trim() || '-';
  const value = [
    c.cyan('r2'),
    `${c.gray('bucket:')}${c.white(bucket)}`,
    `${c.gray('prefix:')}${c.white(prefix)}`,
  ].join(' ');
  return { label: 'provider', value };
}
