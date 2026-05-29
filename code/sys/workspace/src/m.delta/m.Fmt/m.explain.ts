import { type t } from './common.ts';
import { candidatePaths, ownerOf, workspacePaths } from '../u/u.owners.ts';
import { fileLines, skippedLines } from './u.files.ts';
import { candidateMap, packageHeader, rootSummary } from './u.package.ts';

const DEFAULT_MAX_FILES_PER_PACKAGE = 12;

/** Render changed-file evidence for one git-derived delta root selection. */
export const explain: t.WorkspaceDelta.Fmt.Lib['explain'] = (args) => {
  const delta = args.delta;
  const maxFilesPerPackage = args.maxFilesPerPackage ?? DEFAULT_MAX_FILES_PER_PACKAGE;
  const candidates = candidateMap(delta.collect.candidates);
  const paths = candidatePaths(delta.collect);
  const workspaces = workspacePaths(delta.collect, paths);
  const lines = [
    `Delta: ${delta.ref} → ${delta.head}`,
    `Changed files: ${delta.changedFiles.length}`,
    `Changed packages: ${delta.changedPkgPaths.length}`,
    `Bump roots: ${rootSummary(delta.bumpRootPkgPaths, candidates)}`,
  ];

  if (delta.changedPkgPaths.length > 0) {
    lines.push('');
    for (const pkgPath of delta.changedPkgPaths) {
      lines.push(packageHeader(pkgPath, delta, candidates));
      const files = delta.changedFiles.filter((file) => ownerOf(file, workspaces) === pkgPath);
      lines.push(...fileLines(pkgPath, files, maxFilesPerPackage));
    }
  }

  if (delta.skipped.length > 0) {
    lines.push('', `Skipped files: ${delta.skipped.length}`);
    lines.push(...skippedLines(delta.skipped, maxFilesPerPackage));
  }

  return lines.join('\n');
};
