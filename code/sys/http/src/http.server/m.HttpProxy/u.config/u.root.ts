import type { t } from '../common.ts';
import { HttpProxyResolver } from '../m/m.Resolver.ts';

export function sameRoot(a: t.HttpProxy.Root.Doc | undefined, b: t.HttpProxy.Root.Doc): boolean {
  return a?.target === b.target;
}

export function validateRoot(root: t.HttpProxy.Root.Doc, errorPrefix: string): void {
  try {
    HttpProxyResolver({ root: { upstream: root.target } });
  } catch (cause) {
    throw new Error(`${errorPrefix}: invalid root upstream: ${root.target}`, { cause });
  }
}
