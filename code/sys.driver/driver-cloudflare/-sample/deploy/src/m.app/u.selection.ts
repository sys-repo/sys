import { Is, Obj, Pkg, type t } from './common.ts';

/** Fixed sample budgets, not deployment-wide traffic or memory limits. */
export const LIMITS = Object.freeze({ maxBytes: 1_048_576, timeout: 5_000, maxConcurrent: 4 });
/** Finite admission bounds for the production build and each projection. */
export const DIST_LIMITS: Readonly<t.FsPkg.Dist.Verify.Limits> = Object.freeze({
  manifestBytes: 65_536,
  entries: 256,
  fileBytes: LIMITS.maxBytes,
  totalBytes: 4_194_304,
});

/** Capture configuration, not secrets. Public URL and object prefix are one mapping. */
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

/** Strict sample wrapper; canonical Dist pins remain owned by Pkg. */
export function selectionFrom(input: unknown): t.Selection {
  if (
    !hasKeys(input, ['private', 'public', 'publicAssetBase']) ||
    !Pkg.Is.distPin(input.private) || !Pkg.Is.distPin(input.public) ||
    !isPublicBase(input.publicAssetBase)
  ) throw new Error('Invalid sample build selection.');
  return Obj.deepFreeze({
    private: { 'dist.json': input.private['dist.json'] },
    public: { 'dist.json': input.public['dist.json'] },
    publicAssetBase: input.publicAssetBase,
  });
}

/** Own both targets and pins before credential callbacks or storage work. */
export function snapshotInputs(config: unknown, selection: unknown): t.AppInputs {
  const capturedConfig = configFrom(config);
  const capturedSelection = selectionFrom(selection);
  if (capturedConfig.publicAssetBase !== capturedSelection.publicAssetBase) {
    throw new Error('Sample public asset base changed. Rebuild before publication or serving.');
  }
  return Obj.deepFreeze({ config: capturedConfig, selection: capturedSelection });
}

/** Apply output-role policy to an admitted manifest, including `dist.json` once. */
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

/** Bind only the admitted shell inventory; there are no public-asset relay fallbacks. */
export function routesFor(
  config: t.Config,
  files: readonly string[],
): Readonly<Record<string, string>> {
  const prefix = config.targets.private.prefix;
  const routes: Record<string, string> = { '/': `${prefix}/index.html` };
  for (const file of files) routes[`/${file}`] = `${prefix}/${file}`;
  return Object.freeze(routes);
}

/** Public bases are literal HTTPS directory URLs, never signed or origin-relative URLs. */
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

/** The example admits ordinary Vite filenames, not a general object-key language. */
function isPath(value: unknown): value is string {
  return Is.str(value) && value.length <= 512 &&
    /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(value) &&
    value.split('/').every((part) => part !== '.' && part !== '..');
}

function isPublicAsset(path: string): boolean {
  // Extra documents, source files, maps, keys, and worker entrypoints need an explicit new role.
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
