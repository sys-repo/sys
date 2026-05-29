import { type t } from './common.ts';

/** Render package-relative changed-file lines with deterministic truncation. */
export function fileLines(pkgPath: t.StringPath, files: readonly t.StringPath[], max: number) {
  const visible = files.slice(0, Math.max(0, max));
  const lines = visible.map((file) => `  • ${relativeToPackage(pkgPath, file)}`);
  const remaining = files.length - visible.length;
  if (remaining > 0) lines.push(`  • … ${remaining} more`);
  if (lines.length === 0) lines.push('  • no changed files mapped');
  return lines;
}

/** Render skipped changed-file lines with deterministic truncation. */
export function skippedLines(skipped: readonly t.WorkspaceDelta.Skip[], max: number) {
  const visible = skipped.slice(0, Math.max(0, max));
  const lines = visible.map((skip) => `  • ${skip.file} (${skip.reason})`);
  const remaining = skipped.length - visible.length;
  if (remaining > 0) lines.push(`  • … ${remaining} more`);
  return lines;
}

/**
 * Helpers:
 */
function relativeToPackage(pkgPath: t.StringPath, file: t.StringPath) {
  if (file === pkgPath) return '.';
  const prefix = `${pkgPath}/`;
  return file.startsWith(prefix) ? file.slice(prefix.length) : file;
}
