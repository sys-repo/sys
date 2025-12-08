import { type t, Obj, Fs, Is } from './common.ts';
import { Sequence } from '../sequence/mod.ts';
import { findClosestFilename } from '../u.findClose.ts';
import { makeParser } from '../u.parser.ts';

export type SequenceFilepathLintKind = 'video-path:not-found';

export type SequenceFilepathLint = t.DocLintIssue<SequenceFilepathLintKind> & {
  readonly raw: string;
  readonly resolvedPath: string;
  readonly closestMatch?: string;
};

export type SequenceFilepathLintResult = t.LintResult<SequenceFilepathLintKind>;
type Dag = t.Graph.Dag.Result;

/**
 * Lints all `sequence[].video` file paths for a given document:
 * - Resolves via alias tables.
 * - Checks that the resolved file exists on disk.
 * - For missing files, records a lint issue with an optional closest match.
 */
export async function lintSequenceFilepaths(
  dag: Dag,
  yamlPath: t.ObjectPath,
  docid: t.Crdt.Id,
): Promise<SequenceFilepathLintResult> {
  const Parse = makeParser(yamlPath);
  const root = Parse.parseRoot(dag);
  const node = Parse.findParsedNode(dag, docid);

  const indexResolver = root.alias?.resolver;
  const localResolver = node?.alias?.resolver;
  const seq = await Sequence.fromDag(dag, yamlPath, docid, { validate: false });

  const issues: SequenceFilepathLint[] = [];

  // If we cannot resolve aliases for this document, we currently skip path linting.
  if (!indexResolver || !localResolver || !node || !seq) {
    return { issues };
  }

  for (const item of seq) {
    if (!('video' in item)) continue;

    const raw = item.video;
    if (!Is.str(raw)) continue;

    try {
      const resolved = Parse.Resolve.path(raw, localResolver, indexResolver);
      const path = Fs.Tilde.expand(resolved?.value ?? '');
      if (!path) continue;

      const exists = await Fs.exists(path);
      if (exists) continue;

      // Suggest a closest filename in the same directory, if possible.
      let closestMatch: string | undefined;
      try {
        const siblings = await Fs.glob(Fs.dirname(path)).find('*');
        const filenames = siblings.map((f) => Fs.basename(f.path));
        const filename = Fs.basename(path);
        const closest = findClosestFilename(filename, filenames);
        closestMatch = closest?.name;
      } catch {
        // If globbing fails, we just skip the suggestion.
      }

      let message = `Video file does not exist at resolved path "${path}".`;
      if (closestMatch) message += ` Closest match: ${closestMatch}`;
      issues.push({
        kind: 'video-path:not-found',
        severity: 'error',
        path,
        message,
        doc: { id: docid },
        raw,
        resolvedPath: path,
        closestMatch,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error resolving video path';

      issues.push({
        kind: 'video-path:not-found',
        severity: 'error',
        path: raw ?? '',
        message: `Error resolving video path "${raw ?? ''}": ${message}`,
        doc: { id: docid },
        raw: raw ?? '',
        resolvedPath: '',
      });
    }
  }

  return Obj.asGetter({ issues }, ['issues']);
}
