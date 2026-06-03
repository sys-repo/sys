import { Err, FileMap, Files, Fs, Obj, Path, Pkg, R2, Str, type t } from '../common.ts';
import { Mime } from '../../../cli.serve/m.server/u.mime.ts';

type FilesFactory = (provider: t.DeployTool.Config.Provider.R2) => t.Files.Client.Handle;

type PushArgs = {
  readonly cwd: t.StringDir;
  readonly target: t.R2PushTarget;
  readonly createFiles?: FilesFactory;
};

/** Publish a staged deploy target into an R2-backed writable Files view. */
export async function push(args: PushArgs): Promise<t.PushResult> {
  try {
    await publish(args.target, args.createFiles ?? createFilesClient);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: 'failed',
      hint: 'R2 deploy publish failed.',
      error,
    };
  }
}

async function publish(target: t.R2PushTarget, createFiles: FilesFactory) {
  const { provider, stagingDir } = target;
  const dist = await loadDist(stagingDir);
  const paths = publishPaths(dist);
  const files = createFiles(provider);

  try {
    for (const path of paths) {
      const absolute = absoluteStagedFile(stagingDir, path);
      const read = await Fs.read(absolute);
      if (!read.ok || !read.data) {
        throw Err.std(`Could not read staged deploy file: ${path}`, { cause: read.error });
      }
      const mediaType = mediaTypeOf(path);
      await files.writeBytes(path, read.data, { mediaType });
    }
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

function publishPaths(dist: t.DistPkg): readonly t.Files.String.Path[] {
  const parts = dist.hash?.parts ?? {};
  const files = Obj.keys(parts)
    .map((path) => toFilesPath(String(path)))
    .filter((path) => path !== 'dist.json')
    .sort();
  return [...files, 'dist.json' as t.Files.String.Path];
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
    manifest: true,
  };
}
