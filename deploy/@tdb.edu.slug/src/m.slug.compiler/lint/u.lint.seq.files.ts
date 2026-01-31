import { Fs, Is, Obj, type t } from './common.ts';
import { findClosestFilename } from './u.findClose.ts';
import { walkSequenceMediaPaths } from './u.lint.seq.files.walk.ts';

type Facet = t.SlugLintFacet;
type Dag = t.Graph.Dag.Result;

/**
 * Turn a single walker event into a lint issue (if there is a problem),
 * or `undefined` if everything is OK for that path.
 *
 * This function is shared between:
 *   • plain lint (lintSequenceFilepaths)
 *   • bundler (slug-tree:seq:bundle)
 */
export async function buildSequenceFilepathIssue(
  docid: t.Crdt.Id,
  args: t.LintMediaWalkArgs,
): Promise<t.LintSequenceFilepath | undefined> {
  const { kind, raw, resolvedPath, exists, error } = args;
  type K = t.LintSequenceFilepathKind;
  const lintKind: K = kind === 'image' ? 'image-path:not-found' : 'video-path:not-found';

  // Errors during resolution (alias, path, etc).
  if (error) {
    const detail = Is.errorLike(error) ? error.message : 'Unknown error resolving media path';
    return {
      kind: lintKind,
      severity: 'error',
      path: String(raw),
      message: `Error resolving ${kind} path "${String(raw)}": ${detail}`,
      doc: { id: docid },
      raw: String(raw),
      resolvedPath: resolvedPath || '',
    };
  }

  // Nothing to report if the file exists.
  if (exists) return undefined;

  // Missing file: attempt a "closest match" suggestion in the same directory.
  let closestMatch: string | undefined;
  if (resolvedPath) {
    try {
      const siblings = await Fs.glob(Fs.dirname(resolvedPath)).find('*');
      const filenames = siblings.map((f) => Fs.basename(f.path));
      const filename = Fs.basename(resolvedPath);
      const closest = findClosestFilename(filename, filenames);
      closestMatch = closest?.name;
    } catch {
      // If globbing fails, we just skip the suggestion.
    }
  }

  const pathForMessage = resolvedPath || String(raw);
  let message = `File does not exist at resolved path "${pathForMessage}".`;
  if (closestMatch) message += ` Closest match: ${closestMatch}`;

  return {
    kind: lintKind,
    severity: 'error',
    path: pathForMessage,
    message,
    doc: { id: docid },
    raw: String(raw),
    resolvedPath: resolvedPath || '',
    closestMatch,
  };
}

/**
 * Lints all media file paths for a given document:
 * - Uses the shared media-path walker (video + image).
 * - Checks that the resolved file exists on disk.
 * - For missing files, records a lint issue with an optional closest match.
 */
export async function lintSequenceFilepaths(
  dag: Dag,
  yamlPath: t.ObjectPath,
  docid: t.Crdt.Id,
  opts: { facets?: Facet[] } = {},
): Promise<t.LintSequenceFilepathResult> {
  const facets: Facet[] = (opts.facets ?? []).filter((v) => v.startsWith('sequence:file:'));
  const issues: t.LintSequenceFilepath[] = [];

  await walkSequenceMediaPaths(dag, yamlPath, docid, facets, async (args) => {
    const issue = await buildSequenceFilepathIssue(docid, args);
    if (issue) issues.push(issue);
  });

  return Obj.asGetter({ issues }, ['issues']);
}
