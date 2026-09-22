import { Is, type t } from './common.ts';

/** Resolve only the configured names; diagnostics contain names, never credential values. */
export function credentialsFrom(
  names: t.CredentialNames,
  env: t.EnvReader,
): t.R2.Credentials {
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

/** Sample task presentation error; retain names only, never the upstream diagnostic or values. */
export function missingCredentialsError(names: readonly string[]): Error {
  return Object.assign(new Error(`Sample credentials are missing: ${names.join(', ')}.`), {
    name: 'SampleMissingCredentials',
    missingEnv: Object.freeze([...names]),
  });
}

/** Recognize only the sample's names-only setup error, not arbitrary provider messages. */
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
