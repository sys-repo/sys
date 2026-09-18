import { Is, Obj, Pkg, type t } from './common.ts';

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
  return Obj.deepFreeze({
    accountId,
    bucket,
    prefix,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
    limits: LIMITS,
  });
}

/** Own the target and pin before credential callbacks or storage work. */
export function snapshotInputs(config: unknown, pin: unknown): t.AppInputs {
  const target = configFrom(config);
  if (!Pkg.Is.distPin(pin)) throw new Error('Invalid sample Dist pin.');
  return Obj.deepFreeze({ config: target, pin: { 'dist.json': pin['dist.json'] } });
}

/** Apply sample filename policy to an admitted manifest, including `dist.json` once. */
export function selectionFiles(dist: t.DeepReadonly<t.DistPkg>): readonly string[] {
  const files = [...Obj.keys(dist.hash.parts).map(String), 'dist.json'].sort();
  if (!files.includes('index.html') || !files.every(isPath)) {
    throw new Error('Invalid sample manifest filenames.');
  }
  return Object.freeze(files);
}

/** Bind admitted filenames to one captured storage prefix. */
export function routesFor(
  config: t.Config,
  files: readonly string[],
): Readonly<Record<string, string>> {
  const routes: Record<string, string> = { '/': `${config.prefix}/index.html` };
  for (const file of files) routes[`/${file}`] = `${config.prefix}/${file}`;
  return Object.freeze(routes);
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
