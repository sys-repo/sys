import { Is, Obj, Pkg, type t } from './common.ts';

/** Sample-owned build record, outside both distribution roots. */
export const BUILD_RECORD_FILENAME = 'dist.pins.json';

/** Response size, deadline, and concurrent-request limits. */
export const LIMITS = Object.freeze({ maxBytes: 1_048_576, timeout: 5_000, maxConcurrent: 4 });
/** Verification limits for each distribution. */
export const DIST_LIMITS: Readonly<t.FsPkg.Dist.Verify.Limits> = Object.freeze({
  manifestBytes: 65_536,
  entries: 256,
  fileBytes: LIMITS.maxBytes,
  totalBytes: 4_194_304,
});

/** Combined limit for the private and public distributions. */
export const DIST_BATCH_LIMITS: Readonly<t.FsPkg.Dist.BatchLimits> = Object.freeze({
  inventories: 2,
  totalBytes: 4_194_304,
});

/** Validate and copy configuration, including the public URL-to-prefix mapping. */
export function configFrom(input: unknown): t.Config {
  if (!hasKeys(input, ['accountId', 'targets', 'publicAssetBase', 'credentials', 'limits'])) {
    throw new Error('Invalid sample configuration.');
  }
  const { accountId, targets, publicAssetBase, credentials, limits } = input;
  if (
    !Is.str(accountId) || !/^[a-f0-9]{32}$/.test(accountId) ||
    !hasKeys(targets, ['private', 'public']) ||
    !isTarget(targets.private) || !isTarget(targets.public) ||
    targets.private.bucket === targets.public.bucket ||
    !isPublicBase(publicAssetBase) ||
    new URL(publicAssetBase).pathname !== `/${targets.public.prefix}/` ||
    !hasKeys(credentials, ['serve', 'pushPrivate', 'pushPublic']) ||
    !isCredentials(credentials.serve) || !isCredentials(credentials.pushPrivate) ||
    !isCredentials(credentials.pushPublic) || !hasKeys(limits, Obj.keys(LIMITS)) ||
    Obj.entries(LIMITS).some(([key, value]) => limits[key] !== value)
  ) throw new Error('Invalid sample configuration.');
  return Obj.deepFreeze({
    accountId,
    targets: { private: { ...targets.private }, public: { ...targets.public } },
    publicAssetBase,
    credentials: {
      serve: { ...credentials.serve },
      pushPrivate: { ...credentials.pushPrivate },
      pushPublic: { ...credentials.pushPublic },
    },
    limits: LIMITS,
  });
}

/** Capture configuration, named pins, and the matching recorded build base before IO. */
export function snapshotInputs(config: unknown, buildRecord: unknown): t.AppInputs {
  const capturedConfig = configFrom(config);
  try {
    if (
      !hasKeys(buildRecord, ['selection', 'publicAssetBase']) ||
      Object.getPrototypeOf(buildRecord) !== Object.prototype ||
      Reflect.ownKeys(buildRecord).length !== 2
    ) throw new Error();
    const fields = Object.getOwnPropertyDescriptors(buildRecord);
    if (
      !Obj.hasOwn(fields.selection, 'value') || !Obj.hasOwn(fields.publicAssetBase, 'value')
    ) throw new Error();
    const publicAssetBase = fields.publicAssetBase.value;
    if (!isPublicBase(publicAssetBase) || publicAssetBase !== capturedConfig.publicAssetBase) {
      throw new Error();
    }
    const selection = Pkg.Dist.Pins.capture(fields.selection.value, {
      names: { private: true, public: true },
    });
    return Object.freeze({
      config: capturedConfig,
      buildRecord: Object.freeze({ selection, publicAssetBase }),
    });
  } catch {
    throw new Error(
      'Invalid sample build record. Run deno task build with the current public asset base.',
    );
  }
}

/** Put `index.html` in the private distribution and frontend assets in the public one. */
export function partitionBuild(dist: t.DeepReadonly<t.DistPkg>) {
  const files = selectionFiles(dist, 'build');
  return {
    private: ['index.html'],
    public: files.filter((path) => path !== 'dist.json' && path !== 'index.html'),
  };
}

/** Check filenames for the requested role and include `dist.json` in the result. */
export function selectionFiles(
  dist: t.DeepReadonly<t.DistPkg>,
  role: 'build' | t.Audience = 'private',
): readonly string[] {
  const payloads = Obj.keys(dist.hash.parts).map(String).sort();
  const valid = payloads.every(isPath) && !payloads.includes('dist.json') &&
    (role === 'private'
      ? payloads.length === 1 && payloads[0] === 'index.html'
      : payloads.every((file) =>
        (role === 'build' && file === 'index.html') || isPublicAsset(file)
      ) && (role === 'public' || payloads.includes('index.html')) &&
        payloads.some((file) => file.endsWith('.js')) &&
        payloads.some((file) => file.endsWith('.css')));
  if (!valid) throw new Error(`Invalid sample ${role} manifest filenames.`);
  return Object.freeze([...payloads, 'dist.json'].sort());
}

/** Map selected files to private storage keys; `/` serves `index.html`. */
export function routesFor(
  config: t.Config,
  files: readonly string[],
): Readonly<Record<string, string>> {
  const prefix = config.targets.private.prefix;
  const routes: Record<string, string> = { '/': `${prefix}/index.html` };
  for (const file of files) routes[`/${file}`] = `${prefix}/${file}`;
  return Object.freeze(routes);
}

/** Accept an HTTPS directory URL without credentials, query parameters, or a fragment. */
export function isPublicBase(value: unknown): value is string {
  if (!Is.str(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password &&
      !url.search && !url.hash && url.href === value && url.pathname.endsWith('/');
  } catch {
    return false;
  }
}

/** Restrict filenames to simple ASCII path segments. */
function isPath(value: unknown): value is string {
  return Is.str(value) && value.length <= 512 &&
    /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(value) &&
    value.split('/').every((part) => part !== '.' && part !== '..');
}

function isPublicAsset(path: string): boolean {
  // Worker scripts require a separate delivery route.
  return /\.(?:js|css|json|svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|otf)$/.test(path) &&
    !/(?:^|\/)(?:sw|worker|service-worker)(?:[.-]|$)/i.test(path);
}

function hasKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return Is.record(value) && Obj.keys(value).length === keys.length &&
    Obj.keys(value).every((key) => keys.includes(key));
}

function isTarget(value: unknown): value is t.Target {
  return hasKeys(value, ['bucket', 'prefix']) && isPath(value.bucket) &&
    /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(value.bucket) && isPath(value.prefix);
}

function isCredentials(value: unknown): value is t.CredentialNames {
  const isName = (name: unknown): name is string => Is.str(name) && /^[A-Z][A-Z0-9_]*$/.test(name);
  return hasKeys(value, ['accessKeyId', 'secretAccessKey']) &&
    isName(value.accessKeyId) && isName(value.secretAccessKey) &&
    value.accessKeyId !== value.secretAccessKey;
}
