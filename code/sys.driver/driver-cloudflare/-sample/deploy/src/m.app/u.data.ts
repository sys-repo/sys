import { Fs, Json, type t } from './common.ts';
import { DIST_LIMITS, LIMITS, snapshotInputs } from './u.selection.ts';

/** Read and retain this run's package data; never infer an expectation from storage. */
export async function readInputs(
  root = Fs.Path.fromFileUrl(new URL('../../', import.meta.url)),
): Promise<t.AppInputs> {
  const config = await readData(Fs.Path.toFileUrl(Fs.join(root, 'r2.config.json')));
  const pin = await readData(Fs.Path.toFileUrl(Fs.join(root, 'dist.pin.json')));
  return snapshotInputs(config, pin);
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
