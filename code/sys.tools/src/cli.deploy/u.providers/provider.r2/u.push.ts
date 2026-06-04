import { Err, FileMap, Files, Fs, Json, Obj, Path, Pkg, R2, Str, type t } from '../common.ts';
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
    const plan = publishFiles(dist, remote);
    const resultFiles: t.PushPublishFile[] = [];

    for (const entry of plan) {
      if (entry.status === 'skipped') {
        resultFiles.push(entry);
        continue;
      }

      const path = entry.path;
      const absolute = absoluteStagedFile(stagingDir, path);
      const read = await Fs.read(absolute);
      if (!read.ok || !read.data) {
        throw Err.std(`Could not read staged deploy file: ${path}`, { cause: read.error });
      }
      const mediaType = entry.mediaType ?? mediaTypeOf(path);
      await files.writeBytes(path, read.data, { mediaType });
      resultFiles.push({ ...entry, bytes: read.data.byteLength, mediaType });
    }

    const expected = new Set(plan.map((entry) => entry.path));
    const prune = await pruneStaleFiles(files, expected);
    return { publish: { files: resultFiles }, prune };
  } finally {
    files.dispose();
  }
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
    const result = await files.cmd.send(Files.Cmd.Name.read, {
      path: 'dist.json' as t.Files.String.Path,
    });
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
  remote?: t.DistPkg,
): readonly t.PushPublishFile[] {
  const remoteMatchesDist = remote?.hash.digest === dist.hash.digest;
  const parts = dist.hash?.parts ?? {};
  const remoteParts = remote?.hash.parts ?? {};
  const files = Obj.keys(parts)
    .map((rawPath) => {
      const path = toFilesPath(String(rawPath));
      return { path, digest: parts[String(rawPath)], mediaType: mediaTypeOf(path) };
    })
    .filter((file) => file.path !== 'dist.json')
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((file): t.PushPublishFile => ({
      ...file,
      status: remoteMatchesDist || remoteParts[file.path] === file.digest ? 'skipped' : 'written',
    }));

  return [
    ...files,
    {
      path: 'dist.json' as t.Files.String.Path,
      status: remoteMatchesDist ? 'skipped' : 'written',
      digest: dist.hash.digest,
      mediaType: mediaTypeOf('dist.json' as t.Files.String.Path),
    },
  ];
}

async function pruneStaleFiles(
  files: t.Files.Client.Handle,
  expected: ReadonlySet<t.Files.String.Path>,
): Promise<t.PushPruneStats | undefined> {
  const remote = await listRemoteFiles(files);
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
