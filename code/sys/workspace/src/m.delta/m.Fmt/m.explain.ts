import { c, Cli, Str, type t } from './common.ts';
import { candidatePaths, ownerOf, workspacePaths } from '../u/u.owners.ts';
import { fileLines, skippedLines } from './u.files.ts';
import { candidateMap, packageHeader, rootSummary } from './u.package.ts';

const DEFAULT_MAX_FILE_ROWS_PER_GROUP = 5;

/** Render changed-file evidence for one git-derived delta root selection. */
export const explain: t.WorkspaceDelta.Fmt.Lib['explain'] = (args) => {
  const delta = args.delta;
  const files = {
    width: args.width ?? Cli.Screen.size().width,
    rows: DEFAULT_MAX_FILE_ROWS_PER_GROUP,
    maxFiles: args.maxFilesPerPackage,
  };
  const candidates = candidateMap(delta.collect.candidates);
  const paths = candidatePaths(delta.collect);
  const workspaces = workspacePaths(delta.collect, paths);
  const lines = [summaryTable([
    ['delta', `${delta.ref} → ${delta.head}`],
    ['files', String(delta.changedFiles.length)],
    ['packages', String(delta.changedPkgPaths.length)],
    ['roots', rootSummary(delta.bumpRootPkgPaths, candidates)],
  ])];

  if (delta.changedPkgPaths.length > 0) {
    lines.push('');
    for (const pkgPath of delta.changedPkgPaths) {
      lines.push(packageHeader(pkgPath, delta, candidates));
      const changedFiles = delta.changedFiles.filter((file) =>
        ownerOf(file, workspaces) === pkgPath
      );
      lines.push(...fileLines(pkgPath, changedFiles, files));
    }
  }

  if (delta.skipped.length > 0) {
    lines.push('', `Skipped files: ${delta.skipped.length}`);
    lines.push(...skippedLines(delta.skipped, files));
  }

  return lines.join('\n');
};

function summaryTable(rows: readonly (readonly [label: string, value: string])[]) {
  const table = Cli.Table.create([]);
  rows.forEach(([label, value]) => table.push([c.gray(label), c.white(value)]));
  return Str.trimEdgeNewlines(String(table));
}
