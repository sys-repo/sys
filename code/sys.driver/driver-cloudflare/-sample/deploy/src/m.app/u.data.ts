import { Fs, Json } from './common.ts';
import { DIST_LIMITS, LIMITS } from './u.selection.ts';

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
