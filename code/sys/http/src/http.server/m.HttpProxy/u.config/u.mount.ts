import type { t } from '../common.ts';
import { HttpProxyResolver } from '../m/m.Resolver.ts';

export function sameMount(a: t.HttpProxy.Mount.Doc, b: t.HttpProxy.Mount.Doc): boolean {
  return a.path === b.path && a.target === b.target;
}

export function normalizeMounts(
  mounts: readonly t.HttpProxy.Mount.Doc[],
  errorPrefix: string,
): readonly t.HttpProxy.Mount.Doc[] {
  const seen = new Set<string>();
  for (const mount of mounts) {
    validateMount(mount, errorPrefix);
    if (seen.has(mount.path)) {
      throw new Error(`${errorPrefix}: duplicate mount path: ${mount.path}`);
    }
    seen.add(mount.path);
  }
  return mounts;
}

export function validateMount(mount: t.HttpProxy.Mount.Doc, errorPrefix: string): void {
  try {
    HttpProxyResolver({
      mounts: [{ mountPath: mount.path, upstream: mount.target }],
    });
  } catch (cause) {
    throw new Error(`${errorPrefix}: invalid mount: ${mount.path} -> ${mount.target}`, { cause });
  }
}
