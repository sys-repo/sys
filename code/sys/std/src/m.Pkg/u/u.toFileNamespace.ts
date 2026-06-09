import { Is, type t } from '../common.ts';

export const toFileNamespace: t.Pkg.Lib['toFileNamespace'] = (pkg) => {
  const name = normalizePkgName(Is.str(pkg?.name) ? pkg.name : '');
  return name.replaceAll('/', '.') as t.StringName;
};

/**
 * Helpers:
 */
function normalizePkgName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Pkg name is required.');
  if (trimmed.includes('<') || trimmed.includes('>')) {
    throw new Error(`Invalid pkg name: "${trimmed}".`);
  }
  if (/\s/.test(trimmed)) {
    throw new Error(`Invalid pkg name (whitespace): "${trimmed}".`);
  }
  const collapsed = collapseSlashes(trimmed);
  if (!/^[A-Za-z0-9@./-]+$/.test(collapsed)) {
    throw new Error(`Invalid pkg name (characters): "${trimmed}".`);
  }
  return collapsed;
}

function collapseSlashes(name: string): string {
  let current = name;
  while (current.includes('//')) {
    current = current.replaceAll('//', '/');
  }
  return current;
}
