import { FsPkg, Is, Num, Obj, type t } from '../common.ts';

export type ReadDependencies = {
  readonly readPart: t.FsPkg.Dist.Pinned.ReadPart.Method;
};

/** Resolve one FilesStatic reference and authenticate its exact bytes. */
export async function readAsset(args: {
  readonly backing: t.FilesStatic.Readonly;
  readonly dir: t.StringDir;
  readonly path: t.Files.String.Path;
  readonly signal: AbortSignal;
  readonly until: t.UntilInput;
  readonly deps: ReadDependencies;
}): Promise<t.HttpServer.ServeFileBytes.Read.Result> {
  let result: unknown;
  try {
    result = await args.backing.handlers['files:read'](
      { path: args.path },
      context(args.signal),
    );
  } catch (cause) {
    return filesFailure(cause);
  }

  const authority = readAuthority(result, args.path);
  if (!authority) return { kind: 'failure' };

  const read = await args.deps.readPart({
    dir: args.dir,
    path: authority.path,
    checksum: authority.checksum,
    size: authority.size,
    until: args.until,
  });
  if (read.kind === 'read') return { kind: 'bytes', bytes: read.bytes };

  switch (read.kind) {
    case 'missing':
      return { kind: 'missing' };
    case 'cancelled':
      return { kind: 'cancelled' };
    case 'content-mismatch':
    case 'unsafe-path':
    case 'symlink':
    case 'changed':
      return { kind: 'changed' };
    default:
      return { kind: 'failure' };
  }
}

type ReadAuthority = {
  readonly path: t.Files.String.Path;
  readonly checksum: t.StringHash;
  readonly size: t.NumberBytes;
};

function readAuthority(input: unknown, requested: t.Files.String.Path): ReadAuthority | undefined {
  try {
    if (!Is.plainObject(input) || data(input, 'kind') !== 'ref') return;
    const file = data(input, 'file');
    const ref = data(input, 'contentRef');
    if (!Is.plainObject(file) || !Is.plainObject(ref)) return;
    if (data(file, 'kind') !== 'file' || data(ref, 'kind') !== 'hash') return;

    const path = data(ref, 'path');
    const checksum = data(ref, 'hash');
    const size = data(ref, 'size');
    if (path !== requested || data(file, 'path') !== requested) return;
    if (data(file, 'hash') !== checksum || data(file, 'size') !== size) return;
    if (!Is.str(checksum) || !Num.Is.safeInt(size) || size < 0) return;

    const parsed = FsPkg.Dist.Part.parse(checksum);
    if (!parsed || parsed.hash !== checksum || parsed.size !== undefined) return;
    return Object.freeze({ path, checksum: parsed.hash, size });
  } catch {
    return;
  }
}

function context(signal: AbortSignal): t.Cmd.Handler.Context<
  t.Files.Cmd.Name,
  t.Files.Cmd.Event,
  'files:read'
> {
  return {
    id: 'dist-server:files-read' as t.Cmd.ReqId,
    name: 'files:read',
    signal,
    emit(_event: never) {
      return undefined;
    },
  };
}

function data(input: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  return descriptor && Obj.hasOwn(descriptor, 'value') ? descriptor.value : undefined;
}

function filesFailure(cause: unknown): t.HttpServer.ServeFileBytes.Read.Result {
  if (!(cause instanceof Error)) return { kind: 'failure' };
  switch (cause.name) {
    case 'FilesStaticError.InvalidPath':
    case 'FilesStaticError.NotFound':
    case 'FilesStaticError.NotFile':
    case 'FilesStaticError.PolicyDenied':
      return { kind: 'missing' };
    default:
      return { kind: 'failure' };
  }
}
