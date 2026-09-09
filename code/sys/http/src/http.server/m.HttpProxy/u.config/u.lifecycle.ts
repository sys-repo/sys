import type { t } from '../common.ts';

export function sameLifecycle(a: t.HttpProxy.Config.Doc, b: t.HttpProxy.Config.Doc): boolean {
  return a.name === b.name && a.hostname === b.hostname && a.port === b.port;
}
