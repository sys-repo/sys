import { type t, Fs, Is, Obj } from './common.ts';
import { findClosestFilename } from './u.findClose.ts';
import { walkSequenceMediaPaths } from './u.lint.seq.filepaths.walk.ts';

type Facet = t.DocLintFacet;
type Dag = t.Graph.Dag.Result;

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
): Promise<t.SequenceFilepathLintResult> {
  const facets: Facet[] = (opts.facets ?? []).filter((v) => v.startsWith('sequence:file:'));
  const issues: t.SequenceFilepathLint[] = [];

  await walkSequenceMediaPaths(
    dag,
    yamlPath,
    docid,
    facets,
    async ({ kind, raw, resolvedPath, exists, error }) => {
      type K = t.SequenceFilepathLintKind;
      const lintKind: K = kind === 'image' ? 'image-path:not-found' : 'video-path:not-found';

      // Errors during resolution (alias, path, etc).
      if (error) {
        const detail = Is.errorLike(error) ? error.message : 'Unknown error resolving media path';
        issues.push({
          kind: lintKind,
          severity: 'error',
          path: raw,
          message: `Error resolving ${kind} path "${raw}": ${detail}`,
          doc: { id: docid },
          raw,
          resolvedPath: resolvedPath || '',
        });
        return;
      }

      // File exists on disk: nothing to report.
      if (exists) return;

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

      const pathForMessage = resolvedPath || raw;
      let message = `File does not exist at resolved path "${pathForMessage}".`;
      if (closestMatch) message += ` Closest match: ${closestMatch}`;

      issues.push({
        kind: lintKind,
        severity: 'error',
        path: pathForMessage,
        message,
        doc: { id: docid },
        raw,
        resolvedPath: resolvedPath || '',
        closestMatch,
      });
    },
  );

  return Obj.asGetter({ issues }, ['issues']);
}
