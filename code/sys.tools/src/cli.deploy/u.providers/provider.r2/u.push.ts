import {
  Await,
  Err,
  FileMap,
  Files,
  Fs,
  Json,
  Num,
  Obj,
  Path,
  Pkg,
  R2,
  Str,
  type t,
} from '../common.ts';
import { Mime } from '../../../cli.serve/m.server/u.mime.ts';

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

type PublishFilesOptions = {
  readonly remote?: t.DistPkg;
  readonly remoteFiles?: readonly t.Files.File[];
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
  const dist = await loadDist(stagingDir);
  const files = createFiles(provider);

  try {
    const remote = options.force ? undefined : await readRemoteDist(files);
    const remoteFiles = !options.force && remote ? await listRemoteFiles(files) : undefined;
    const plan = publishFiles(dist, { remote, remoteFiles });
    const resultFiles = await writePublishPlan(files, stagingDir, plan);

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
    resultFiles[dist.index] = await writePublishFile(files, stagingDir, dist.entry);
  }

  return resultFiles;
}

async function writePublishFile(
  files: t.Files.Client.Handle,
  stagingDir: t.StringDir,
  entry: t.PushPublishFile,
): Promise<t.PushPublishFile> {
  const path = entry.path;
  const absolute = absoluteStagedFile(stagingDir, path);
  const read = await Fs.read(absolute);
  if (!read.ok || !read.data) {
    throw Err.std(`Could not read staged deploy file: ${path}`, { cause: read.error });
  }
  const mediaType = entry.mediaType ?? mediaTypeOf(path);
  await files.writeBytes(path, read.data, { mediaType });
  return { ...entry, bytes: read.data.byteLength, mediaType };
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

async function loadDist(stagingDir: t.StringDir): Promise<t.DistPkg> {
  const res = await Pkg.Dist.load(stagingDir);
  if (!res.dist?.hash?.digest) {
    throw Err.std(`Missing staged dist metadata: ${Fs.trimCwd(stagingDir)}`);
  }
  return res.dist;
}

async function readRemoteDist(files: t.Files.Client.Handle): Promise<t.DistPkg | undefined> {
  try {
    const result = await files.cmd.send(Files.Cmd.Name.read, { path: DIST_PATH });
    const text = result.kind === 'inline'
      ? result.content
      : await Files.ContentRef.text(result.contentRef);
    const parsed = Json.safeParse<unknown>(text);
    if (!parsed.ok || !Pkg.Is.dist(parsed.data)) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
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
      status: remote && remoteMatchesDist && distExists && !wroteAsset ? 'skipped' : 'written',
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
  const ext = Path.extname(path).replace(/^\./, '').toLowerCase();
  return (Mime.extensionMap[ext] ?? FileMap.Data.contentType.fromPath(path)) as t.StringMimeType;
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
