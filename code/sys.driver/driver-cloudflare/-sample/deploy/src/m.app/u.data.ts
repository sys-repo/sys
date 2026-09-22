import { Fs, Json, type t } from './common.ts';
import { BUILD_RECORD_FILENAME, DIST_LIMITS, LIMITS, snapshotInputs } from './u.selection.ts';

/** Read and retain this run's package data; never infer an expectation from storage. */
export async function readInputs(
  root = Fs.Path.fromFileUrl(new URL('../../', import.meta.url)),
): Promise<t.AppInputs> {
  const config = await readData(Fs.Path.toFileUrl(Fs.join(root, 'r2.config.json')));
  let buildRecord: unknown;
  try {
    buildRecord = await readData(Fs.Path.toFileUrl(Fs.join(root, BUILD_RECORD_FILENAME)));
  } catch (error) {
    if (Fs.Snapshot.Is.failure(error) && error.kind === 'missing') {
      throw new Error(
        'Missing sample build record. Run deno task build with the current public asset base.',
      );
    }
    throw error;
  }
  return snapshotInputs(config, buildRecord);
}

/** Read bounded JSON from one explicit local file URL. */
export async function readData(url: URL): Promise<unknown> {
  const path = Fs.Path.fromFileUrl(url);
  const { bytes } = await Fs.Snapshot.file({
    root: Fs.dirname(path),
    path,
    maxBytes: DIST_LIMITS.manifestBytes,
    timeout: LIMITS.timeout,
  });
  const parsed = Json.safeParse<unknown>(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (!parsed.ok) throw new Error('Sample data must be valid JSON.');
  return parsed.data;
}
