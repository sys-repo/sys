import { Fs, Is, Obj, Pkg, type t } from './common.ts';

/** Sample-owned build record, outside both distribution roots. */
export const BUILD_RECORD_FILENAME = 'dist.pins.json';

/** Response size, deadline, and concurrent-request limits. */
export const READ_LIMITS = Object.freeze({ maxBytes: 1_048_576, timeout: 5_000, maxConcurrent: 4 });
/** Verification limits for each distribution. */
export const DIST_LIMITS: Readonly<t.FsPkg.Dist.Verify.Limits> = Object.freeze({
  manifestBytes: 65_536,
  entries: 256,
  fileBytes: READ_LIMITS.maxBytes,
  totalBytes: 4_194_304,
});

/** Combined limit for the private and public distributions. */
export const DIST_BATCH_LIMITS: Readonly<t.FsPkg.Dist.BatchLimits> = Object.freeze({
  inventories: 2,
  totalBytes: 4_194_304,
});

/** Validate and copy configuration, including the public URL-to-prefix mapping. */
export function configFrom(input: unknown): t.Config {
  if (!hasKeys(input, ['accountId', 'targets', 'publicAssetBase', 'credentials'])) {
    throw new Error('Invalid sample configuration.');
  }
  const { accountId, targets, publicAssetBase, credentials } = input;
  if (
    !Is.str(accountId) || !/^[a-f0-9]{32}$/.test(accountId) ||
    !hasKeys(targets, ['private', 'public']) ||
    !isTarget(targets.private) || !isTarget(targets.public) ||
    targets.private.bucket === targets.public.bucket ||
    !isPublicBase(publicAssetBase) ||
    new URL(publicAssetBase).pathname !== `/${targets.public.prefix}/` ||
    !hasKeys(credentials, ['serve', 'pushPrivate', 'pushPublic']) ||
    !isCredentials(credentials.serve) || !isCredentials(credentials.pushPrivate) ||
    !isCredentials(credentials.pushPublic)
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
      buildRecord: Object.freeze({ publicAssetBase, selection }),
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

/** Verify one local audience against its recorded pin and filename policy. */
export async function selectBuild(
  pin: t.DistPin,
  root: string,
  audience: t.Audience = 'private',
): Promise<t.BuildSelection> {
  if (!Pkg.Is.distPin(pin)) throw new Error('Invalid sample Dist pin.');
  const integrity = pin['dist.json'];
  const dir = Fs.resolve(root, `dist.${audience}`);
  const verify = () => Pkg.Dist.Pinned.verify({ dir, integrity, limits: DIST_LIMITS });
  const verified = await verify();
  if (verified.kind !== 'verified') return verified;
  const files = selectionFiles(verified.evidence.dist, audience);
  return { ...verified, files, dir, verify };
}

/** Check both distributions and their filenames before publishing either audience. */
export async function selectPublication(input: t.DistPins<t.Audience>, root: string) {
  const checked = await Pkg.Dist.Pins.verify({
    root,
    selection: input,
    dirs: { private: 'dist.private', public: 'dist.public' },
    limits: DIST_LIMITS,
    batch: DIST_BATCH_LIMITS,
  });
  if (checked.kind !== 'verified') {
    throw new Error(`Sample ${checked.name ?? 'selection'} Dist refused: ${checked.kind}.`);
  }
  return {
    private: selectionFiles(checked.evidence.private.dist, 'private'),
    public: selectionFiles(checked.evidence.public.dist, 'public'),
  } as const;
}

/** Accept an HTTPS directory URL without credentials, query parameters, or a fragment. */
function isPublicBase(value: unknown): value is string {
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
