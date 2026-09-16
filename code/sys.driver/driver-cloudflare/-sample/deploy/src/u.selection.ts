import { Arr, Is, Obj, type t } from './common.ts';

/** Fixed sample budgets, not deployment-wide traffic or memory limits. */
export const LIMITS = Object.freeze({ maxBytes: 1_048_576, timeout: 5_000, maxConcurrent: 4 });
/** Finite admission bounds for the production build. */
export const DIST_LIMITS: Readonly<t.FsPkg.Dist.Verify.Limits> = Object.freeze({
  manifestBytes: 65_536,
  entries: 256,
  fileBytes: LIMITS.maxBytes,
  totalBytes: 4_194_304,
});

/** Validate the target and credential names; budgets must match the fixed sample limits. */
export function configFrom(input: unknown): t.Config {
  if (!Is.record(input)) throw new Error('Invalid sample configuration.');
  const { accountId, bucket, prefix, credentials, limits } = input;
  if (
    !Is.str(accountId) || !/^[a-f0-9]{32}$/.test(accountId) ||
    !isPath(bucket) || bucket.includes('/') || !isPath(prefix) ||
    !Is.record(credentials) ||
    !isEnvName(credentials.accessKeyId) || !isEnvName(credentials.secretAccessKey) ||
    credentials.accessKeyId === credentials.secretAccessKey || !Is.record(limits) ||
    Obj.entries(LIMITS).some(([key, value]) => limits[key] !== value)
  ) throw new Error('Invalid sample configuration.');
  return {
    accountId,
    bucket,
    prefix,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
    limits: LIMITS,
  };
}

/** Copy a valid local manifest checksum and unique filename selection. */
export function artifactFrom(input: unknown): t.Artifact {
  if (!Is.record(input)) throw new Error('Invalid sample artifact.');
  const { integrity, files } = input;
  if (
    !Is.str(integrity) || !/^sha256-[a-f0-9]{64}$/.test(integrity) ||
    !Is.array(files) || files.length > DIST_LIMITS.entries || !files.every(isPath) ||
    Arr.uniq(files).length !== files.length ||
    !files.includes('index.html') || !files.includes('dist.json')
  ) throw new Error('Invalid sample artifact.');
  return { integrity, files: [...files] };
}

/** Exact local selection → exact storage keys. No bucket enumeration or remote manifest. */
export function routesFor(config: t.Config, artifact: t.Artifact): Record<string, string> {
  const routes: Record<string, string> = { '/': `${config.prefix}/index.html` };
  for (const file of artifact.files) routes[`/${file}`] = `${config.prefix}/${file}`;
  return routes;
}

/** The example admits ordinary Vite filenames, not a general object-key language. */
function isPath(value: unknown): value is string {
  return Is.str(value) && value.length <= 512 &&
    /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(value) &&
    value.split('/').every((part) => part !== '.' && part !== '..');
}

function isEnvName(value: unknown): value is string {
  return Is.str(value) && /^[A-Z][A-Z0-9_]*$/.test(value);
}
