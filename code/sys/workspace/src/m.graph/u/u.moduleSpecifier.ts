import { Fs, Is } from '../common.ts';

export type ModuleSpecifierKind = 'code-module' | 'opaque-asset' | 'ambiguous';

const codeModuleExtensions: ReadonlySet<string> = new Set([
  '.cjs',
  '.cts',
  '.js',
  '.jsx',
  '.json',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
  '.wasm',
]);

/** Classify whether a specifier belongs to the local Deno module graph. */
export function classifyModuleSpecifier(specifier?: string): ModuleSpecifierKind {
  if (!Is.str(specifier) || !specifier) return 'ambiguous';

  const path = toLocalPath(specifier);
  if (!path) return 'ambiguous';

  const extension = Fs.Path.extname(path).toLowerCase();
  if (!extension) return 'ambiguous';
  return codeModuleExtensions.has(extension) ? 'code-module' : 'opaque-asset';
}

function toLocalPath(specifier: string) {
  try {
    const url = new URL(specifier);
    return url.protocol === 'file:' ? Fs.Path.fromFileUrl(url.href) : undefined;
  } catch {
    return specifier;
  }
}
