export const PUBLISHED_IMPORT_BRIDGES = {
  '@sys/std/num': '@sys/std/value',
  '@sys/std/str': '@sys/std/value',
} as const;

export function applyPublishedImportBridges(
  imports: Record<string, string>,
): Record<string, string> {
  const next = structuredClone(imports);

  for (const [from, to] of Object.entries(PUBLISHED_IMPORT_BRIDGES)) {
    const current = next[from];
    if (typeof current !== 'string') continue;
    next[from] = rewriteImportTarget(current, from, to);
  }

  return next;
}

export function publishedImportBridgeTarget(specifier: string): string | undefined {
  return PUBLISHED_IMPORT_BRIDGES[specifier as keyof typeof PUBLISHED_IMPORT_BRIDGES];
}

function rewriteImportTarget(current: string, from: string, to: string) {
  const fromPkg = sysPackageName(from);
  const toPkg = sysPackageName(to);
  if (!fromPkg || !toPkg) return current;

  const match = current.match(/^jsr:((?:@[^/@]+\/)?[^@/]+)@([^/]+)(\/.*)?$/);
  if (!match) return current;

  const [, , version] = match;
  const suffix = to.slice(toPkg.length);
  return `jsr:${toPkg}@${version}${suffix}`;
}

function sysPackageName(specifier: string): string | undefined {
  if (!specifier.startsWith('@sys/')) return;
  const [scope, name] = specifier.split('/');
  if (!scope || !name) return;
  return `${scope}/${name}`;
}
