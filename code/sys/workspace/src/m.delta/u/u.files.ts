import { Str, type t } from '../common.ts';

/**
 * Normalize and deduplicate workspace-root-relative changed file paths.
 */
export function normalizeChangedFiles(files: readonly t.StringPath[]) {
  return unique(files.map(normalizeFile).filter((file) => file.length > 0));
}

/**
 * Normalize one workspace-root-relative file path for lexical package ownership matching.
 */
export function normalizeFile(file: t.StringPath) {
  const path = Str.splitPathSegments(file.trim()).join('/');
  return Str.trimLeadingDotSlash(path);
}

function unique(values: readonly t.StringPath[]) {
  return [...new Set(values)];
}
