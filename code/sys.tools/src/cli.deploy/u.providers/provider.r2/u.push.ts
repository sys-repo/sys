import {
  Await,
  Err,
  Files,
  Fs,
  Hash,
  Json,
  MediaType,
  Num,
  Obj,
  Path,
  Pkg,
  R2,
  Str,
  type t,
} from '../common.ts';

type FilesFactory = (provider: t.DeployTool.Config.Provider.R2) => t.Files.Client.Handle;

type PushArgs = {
  readonly cwd: t.StringDir;
  readonly target: t.R2PushTarget;
  readonly createFiles?: FilesFactory;
  readonly force?: boolean;
};

type PublishResult = {
  readonly publish: t.PushPublishStats;
  readonly prune?: t.PushPruneStats;
};

type IndexedPublishFile = {
  readonly index: number;
  readonly entry: t.PushPublishFile;
};

type RemoteDist = {
  readonly dist: t.DistPkg;
  readonly integrity?: t.StringHash;
};

type PublishFilesOptions = {
  readonly remote?: t.DistPkg;
  readonly remoteFiles?: readonly t.Files.File[];
  readonly manifestMatches?: boolean;
};

const DIST_PATH = 'dist.json' as t.Files.String.Path;
const PUBLISH_CONCURRENCY = 8;

/**
 * Publish a staged deploy target into an R2-backed writable Files view.
 */
export async function push(args: PushArgs): Promise<t.PushResult> {
  try {
    const result = await publish(args.target, args.createFiles ?? createFilesClient, {
      force: args.force === true,
    });
    return { ok: true, publish: result.publish, prune: result.prune };
  } catch (error) {
    return {
      ok: false,
      reason: 'failed',
      hint: 'R2 deploy publish failed.',
      error,
    };
  }
}

/**
 * Helpers:
 */
async function publish(
  target: t.R2PushTarget,
  createFiles: FilesFactory,
  options: { readonly force: boolean },
): Promise<PublishResult> {
  const { provider, stagingDir } = target;
  const local = await loadDist(stagingDir);
  const files = createFiles(provider);

  try {
    const remote = options.force ? undefined : await readRemoteDist(files);
    const remoteFiles = !options.force && remote ? await listRemoteFiles(files) : undefined;
    const plan = publishFiles(local.dist, {
      remote: remote?.dist,
      remoteFiles,
      manifestMatches: remote?.integrity === local.integrity,
    });
    const resultFiles = await writePublishPlan(files, stagingDir, plan, local.bytes);

    const expected = new Set(plan.map((entry) => entry.path));
    const prune = await pruneStaleFiles(files, expected, remoteFiles);
    return { publish: { files: resultFiles }, prune };
  } finally {
    files.dispose();
  }
}

async function writePublishPlan(
  files: t.Files.Client.Handle,
  stagingDir: t.StringDir,
  plan: readonly t.PushPublishFile[],
  manifestBytes: Uint8Array,
): Promise<readonly t.PushPublishFile[]> {
  const resultFiles = new Array<t.PushPublishFile>(plan.length);
  const assetWrites: IndexedPublishFile[] = [];
  let dist: IndexedPublishFile | undefined;

  for (const [index, entry] of plan.entries()) {
    if (entry.status === 'skipped') {
      resultFiles[index] = entry;
      continue;
    }

    const item = { index, entry };
    if (entry.path === DIST_PATH) dist = item;
    else assetWrites.push(item);
  }

  await runBounded(assetWrites, PUBLISH_CONCURRENCY, async ({ index, entry }) => {
    resultFiles[index] = await writePublishFile(files, stagingDir, entry);
  });

  if (dist) {
    resultFiles[dist.index] = await writePublishFile(files, stagingDir, dist.entry, manifestBytes);
  }

  return resultFiles;
}

async function writePublishFile(
  files: t.Files.Client.Handle,
  stagingDir: t.StringDir,
  entry: t.PushPublishFile,
  bytes?: Uint8Array,
): Promise<t.PushPublishFile> {
  const path = entry.path;
  if (bytes === undefined) {
    const absolute = absoluteStagedFile(stagingDir, path);
    const read = await Fs.read(absolute);
    if (!read.ok || !read.data) {
      throw Err.std(`Could not read staged deploy file: ${path}`, { cause: read.error });
    }
    bytes = read.data;
  }
  const mediaType = entry.mediaType ?? mediaTypeOf(path);
  await files.writeBytes(path, bytes, { mediaType });
  return { ...entry, bytes: bytes.byteLength, mediaType };
}

async function runBounded<T>(
  items: readonly T[],
  concurrency: number,
  run: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;
  if (!Num.Is.safeInt(concurrency) || concurrency < 1) {
    throw Err.std(`Invalid bounded concurrency: ${concurrency}`);
  }

  const limit = Await.semaphore(concurrency);
  let failure: { readonly error: unknown } | undefined;
  const tasks = items.map((item) =>
    limit(async () => {
      if (failure) return;
      try {
        await run(item);
      } catch (error) {
        failure ??= { error };
      }
    })
  );

  const settled = await Promise.allSettled(tasks);
  for (const result of settled) {
    if (result.status === 'rejected') failure ??= { error: result.reason };
  }
  if (failure) throw failure.error;
}

async function loadDist(stagingDir: t.StringDir) {
  const read = await Fs.read(absoluteStagedFile(stagingDir, DIST_PATH));
  if (!read.ok || !read.data) {
    throw Err.std(`Missing staged dist metadata: ${Fs.trimCwd(stagingDir)}`, { cause: read.error });
  }
  const bytes = read.data;
  const parsed = Json.safeParse<unknown>(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (!parsed.ok || !Pkg.Is.dist(parsed.data) || !parsed.data.hash.digest) {
    throw Err.std(`Missing staged dist metadata: ${Fs.trimCwd(stagingDir)}`);
  }
  // Retain the same bytes for comparison and manifest-last publication; do not reserialize JSON.
  return { dist: parsed.data, bytes, integrity: Hash.sha256(bytes) };
}

async function readRemoteDist(files: t.Files.Client.Handle): Promise<RemoteDist | undefined> {
  let result: t.Files.Cmd.Read.Result;
  try {
    result = await files.cmd.send(Files.Cmd.Name.read, { path: DIST_PATH });
  } catch (error) {
    // A storage/runtime refusal takes precedence over any nested absence detail.
    if (R2.Error.diagnostic(error) || R2.Error.permission(error)) throw error;
    // Only explicit Files/R2 absence permits cold-start publication. Unknown failures stop too.
    if (Err.std(error).cause?.name === 'FilesR2Error.NotFound') return undefined;
    throw error;
  }
  if (result.kind === 'inline' && result.truncated) return undefined;
  const bytes = result.kind === 'inline'
    ? new TextEncoder().encode(result.content)
    : await Files.ContentRef.bytes(result.contentRef);

  // Acquisition has succeeded. Unusable metadata is an optimization miss, not a storage failure.
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return undefined;
  }
  const parsed = Json.safeParse<unknown>(text);
  if (!parsed.ok || !Pkg.Is.dist(parsed.data)) return undefined;
  // R2's fatal UTF-8 decoder can strip a BOM. Require the round-trip size before trusting
  // inline text as byte identity; unknown/lossy identity must republish the manifest.
  const exact = result.kind === 'ref' || result.file.size === bytes.byteLength;
  return { dist: parsed.data, integrity: exact ? Hash.sha256(bytes) : undefined };
}

function publishFiles(
  dist: t.DistPkg,
  options: PublishFilesOptions = {},
): readonly t.PushPublishFile[] {
  const { remote, remoteFiles } = options;
  const actual = remoteFiles ? new Set(remoteFiles.map((file) => file.path)) : undefined;
  const remoteMatchesDist = remote?.hash.digest === dist.hash.digest;
  const parts = dist.hash?.parts ?? {};
  const remoteParts = remote?.hash.parts ?? {};
  const files = Obj.keys(parts)
    .map((rawPath) => {
      const path = toFilesPath(String(rawPath));
      return { path, digest: parts[String(rawPath)], mediaType: mediaTypeOf(path) };
    })
    .filter((file) => file.path !== DIST_PATH)
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((file): t.PushPublishFile => {
      const digestMatches = remoteMatchesDist || remoteParts[file.path] === file.digest;
      const exists = actual === undefined || actual.has(file.path);
      return {
        ...file,
        status: remote && digestMatches && exists ? 'skipped' : 'written',
      };
    });
  const wroteAsset = files.some((file) => file.status === 'written');
  const distExists = actual === undefined || actual.has(DIST_PATH);

  return [
    ...files,
    {
      path: DIST_PATH,
      status: remote && remoteMatchesDist && options.manifestMatches && distExists && !wroteAsset
        ? 'skipped'
        : 'written',
      digest: dist.hash.digest,
      mediaType: mediaTypeOf(DIST_PATH),
    },
  ];
}

async function pruneStaleFiles(
  files: t.Files.Client.Handle,
  expected: ReadonlySet<t.Files.String.Path>,
  remoteFiles?: readonly t.Files.File[],
): Promise<t.PushPruneStats | undefined> {
  const remote = remoteFiles ?? await listRemoteFiles(files);
  const stale = remote.filter((file) => !expected.has(file.path));
  const removed: t.PushPruneFile[] = [];

  for (const file of stale) {
    await files.remove(file.path);
    removed.push({ path: file.path, status: 'removed' });
  }

  return removed.length ? { files: removed } : undefined;
}

async function listRemoteFiles(files: t.Files.Client.Handle): Promise<readonly t.Files.File[]> {
  const result: t.Files.File[] = [];
  let cursor: t.Files.Cursor.List | undefined;

  do {
    const page = await files.list(cursor ? { cursor } : undefined);
    for (const entry of page.entries) {
      if (entry.kind === 'file') result.push(entry);
    }
    cursor = page.cursor;
  } while (cursor);

  return result;
}

function toFilesPath(input: string): t.Files.String.Path {
  const raw = String(input ?? '').trim();
  if (!raw || raw.includes('\u0000')) throw Err.std(`Invalid deploy publish path: ${input}`);
  if (Path.Is.absolute(raw)) throw Err.std(`Invalid absolute deploy publish path: ${input}`);

  const segments = Str.splitPathSegments(raw);
  if (!segments.length || segments.some((segment) => segment === '.' || segment === '..')) {
    throw Err.std(`Invalid deploy publish path: ${input}`);
  }
  return segments.join('/') as t.Files.String.Path;
}

function absoluteStagedFile(stagingDir: t.StringDir, path: t.Files.String.Path): t.StringPath {
  const base = Path.resolve(stagingDir, '.');
  const absolute = Path.resolve(base, path);
  if (!absolute.startsWith(`${base}/`)) throw Err.std(`Staged deploy path outside root: ${path}`);
  return absolute as t.StringPath;
}

function createFilesClient(provider: t.DeployTool.Config.Provider.R2): t.Files.Client.Handle {
  const service = R2.Service.create({
    accountId: provider.accountId,
    credentials: provider.credentials,
  });
  const bucket = service.bucket(provider.bucket, { readOrigin: provider.readOrigin });
  const backing = R2.Files.create({
    bucket,
    prefix: provider.prefix,
    policy: publishPolicy(),
  });
  return Files.Client.local(backing);
}

function mediaTypeOf(path: t.Files.String.Path): t.StringMimeType {
  return MediaType.fromPath(path) ?? MediaType.Fallback.binary;
}

function publishPolicy(): t.Files.Policy.Shape {
  return {
    list: '**',
    stat: '**',
    read: '**',
    write: '**',
    remove: '**',
    manifest: true,
  };
}
