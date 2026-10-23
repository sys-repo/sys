import { Fs, Is, Json, type t } from './common.ts';
import { BUILD_RECORD_FILENAME, DIST_LIMITS, READ_LIMITS, snapshotInputs } from './u.selection.ts';

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
    timeout: READ_LIMITS.timeout,
  });
  const parsed = Json.safeParse<unknown>(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (!parsed.ok) throw new Error('Sample data must be valid JSON.');
  return parsed.data;
}

/** Resolve only configured names; diagnostics contain names, never credential values. */
export function credentialsFrom(names: t.CredentialNames, env: t.EnvReader): t.R2.Credentials {
  const accessKeyId = env.get(names.accessKeyId);
  const secretAccessKey = env.get(names.secretAccessKey);
  if (!accessKeyId?.trim() || !secretAccessKey?.trim()) {
    const missing = [
      !accessKeyId?.trim() && names.accessKeyId,
      !secretAccessKey?.trim() && names.secretAccessKey,
    ].filter(Is.str);
    throw missingCredentialsError(missing);
  }
  return { accessKeyId, secretAccessKey };
}

/** Names-only setup error; never retain the upstream diagnostic or credential values. */
export function missingCredentialsError(names: readonly string[]): Error {
  return Object.assign(new Error(`Sample credentials are missing: ${names.join(', ')}.`), {
    name: 'SampleMissingCredentials',
    missingEnv: Object.freeze([...names]),
  });
}

/** Recognize sample setup errors, not arbitrary provider messages. */
export function missingCredentialsOf(error: unknown): readonly string[] | undefined {
  if (!Is.error(error) || error.name !== 'SampleMissingCredentials' || !('missingEnv' in error)) {
    return;
  }
  const names = error.missingEnv;
  if (
    !Is.array(names) || names.length === 0 || !names.every(Is.str) ||
    !names.every((name) => /^[A-Z_][A-Z0-9_]*$/.test(name))
  ) return;
  return Object.freeze([...names]);
}
