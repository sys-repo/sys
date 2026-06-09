import { Is, Str, type t } from '../common.ts';

export const toFileNamespace: t.Pkg.Lib['toFileNamespace'] = (pkg, options = {}) => {
  const name = normalizePkgName(Is.str(pkg?.name) ? pkg.name : '');
  const subpath = normalizeSubpath(options.subpath);
  const path = subpath ? `${name}/${subpath}` : name;
  return path.replaceAll('/', '.') as t.StringName;
};

/**
 * Helpers:
 */
function normalizePkgName(name: string): string {
  const trimmed = name.trim();
  validateNamespacePath(trimmed, 'Pkg name');
  return normalizeSlashPath(trimmed);
}

function normalizeSubpath(path?: t.StringPath): string {
  if (!Is.str(path)) return '';

  const trimmed = Str.trimSlashes(path.trim());
  if (!trimmed) return '';

  validateNamespacePath(trimmed, 'Pkg subpath');
  return normalizeSlashPath(trimmed);
}

function validateNamespacePath(path: string, label: string) {
  if (!path) throw new Error(`${label} is required.`);
  if (path.includes('<') || path.includes('>')) throw new Error(`Invalid ${label}: "${path}".`);
  if (/\s/.test(path)) throw new Error(`Invalid ${label} (whitespace): "${path}".`);
  if (!/^[A-Za-z0-9@./-]+$/.test(path)) {
    throw new Error(`Invalid ${label} (characters): "${path}".`);
  }
}

function normalizeSlashPath(path: string) {
  return Str.splitPathSegments(path).join('/');
}
