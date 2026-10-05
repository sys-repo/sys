import { Fs, Str, type t } from '../common.ts';

type Authority = {
  readonly index: number;
  readonly kind: 'store' | 'mutable';
  readonly path: t.StringAbsoluteDir;
};

export type IsolationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

/** Validate all configured filesystem authorities before any bundle performs work. */
export function validateBundleIsolation(
  location: t.PullTool.ConfigYaml.Location,
): IsolationResult {
  const authorities: Authority[] = [];
  const bundles = location.bundles ?? [];

  for (const [index, bundle] of bundles.entries()) {
    if (bundle.kind === 'dist') {
      const store = resolveTarget(location.dir, bundle.store);
      if (!store) return invalidTarget(index, 'store');
      authorities.push({ index, kind: 'store', path: store });

      if (bundle.project) {
        const project = resolveTarget(location.dir, bundle.project.dir);
        if (!project) return invalidTarget(index, 'projection');
        authorities.push({ index, kind: 'mutable', path: project });
      }
    } else {
      const target = resolveTarget(location.dir, bundle.local.dir);
      if (!target) return invalidTarget(index, 'target');
      authorities.push({ index, kind: 'mutable', path: target });
    }
  }

  // Positional cursors compare each authority pair exactly once.
  for (let left = 0; left < authorities.length; left++) {
    const a = authorities[left];
    if (!a) continue;
    for (let right = left + 1; right < authorities.length; right++) {
      const b = authorities[right];
      if (!b || !overlaps(a.path, b.path)) continue;
      if (a.kind === 'store' && b.kind === 'store' && a.path === b.path) continue;
      return {
        ok: false,
        error: `Pull config filesystem authorities overlap: bundles ${a.index} and ${b.index}.`,
      };
    }
  }

  return { ok: true };
}

function resolveTarget(baseDir: t.StringDir, input: string): t.StringAbsoluteDir | undefined {
  const text = input.trim();
  const normalized = Str.trimLeadingDotSlash(text).replaceAll('\\', '/');
  if (
    !normalized ||
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.endsWith('/..') ||
    normalized.includes('/../') ||
    normalized.split('/').some((part) => part === '.')
  ) {
    return;
  }

  const base = Fs.Path.resolve(baseDir);
  const target = Fs.Path.resolve(baseDir, text);
  const relative = Fs.Path.relative(base, target).replaceAll('\\', '/');
  if (!relative || relative === '.' || relative === '..' || relative.startsWith('../')) return;
  return target.replaceAll('\\', '/') as t.StringAbsoluteDir;
}

function overlaps(a: string, b: string): boolean {
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}

function invalidTarget(index: number, label: string): IsolationResult {
  return { ok: false, error: `Pull config bundle ${index} has an invalid ${label} directory.` };
}
