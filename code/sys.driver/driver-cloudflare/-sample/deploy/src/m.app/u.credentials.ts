import { Is, type t } from './common.ts';

/** Resolve only the configured names; diagnostics contain names, never credential values. */
export function credentialsFrom(
  names: t.Config['credentials'],
  env: t.EnvReader,
): t.R2.Credentials {
  const accessKeyId = env.get(names.accessKeyId);
  const secretAccessKey = env.get(names.secretAccessKey);
  if (!accessKeyId || !secretAccessKey) {
    const missing = [
      !accessKeyId && names.accessKeyId,
      !secretAccessKey && names.secretAccessKey,
    ].filter(Is.str);
    throw new Error(`Sample serving credentials are missing: ${missing.join(', ')}.`);
  }
  return { accessKeyId, secretAccessKey };
}
