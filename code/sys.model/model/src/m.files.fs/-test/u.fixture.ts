import { expect, type t } from '../../-test.ts';
import { utf8ByteLength } from '../../m.files/u/u.bytes.ts';
import { FilesPath } from '../../m.files/u/u.path.ts';
import { Files } from '../mod.ts';
import type * as TCapability from '../t/t.capability.ts';

export type FileNode = {
  readonly kind: 'file';
  readonly content: string;
  readonly size?: t.NumberBytes;
  readonly modifiedAt?: t.UnixTimestamp;
  readonly hash?: t.StringHash;
  readonly mediaType?: t.StringMimeType;
};

export type DirNode = { readonly kind: 'dir' };
export type Node = FileNode | DirNode;
export type NodeMap = Record<t.StringAbsolutePath, Node>;

export type FsFixtureOptions = {
  readonly nodes?: NodeMap;
  readonly realPaths?: Partial<Record<t.StringAbsolutePath, t.StringAbsolutePath>>;
};

export type FsCalls = {
  realPath: number;
  stat: number;
  readText: number;
  walk: number;
  lstat: number;
  ensureDir: number;
  writeFileAtomic: number;
  removeEntry: number;
};

export type FsFixture = {
  readonly fs: t.FilesFs.Capability.Readonly;
  readonly root: t.StringAbsolutePath;
  readonly nodes: NodeMap;
  readonly calls: FsCalls;
};

export type WritableFsFixture = Omit<FsFixture, 'fs'> & {
  readonly fs: t.FilesFs.Capability.Writable;
};

export type SetupOptions = {
  readonly fs?: FsFixtureOptions;
  readonly policy?: t.Files.Policy.Shape;
  readonly maxReadBytes?: t.NumberBytes;
  readonly defaultLimit?: t.Files.Limit;
};

export type SetupWritableOptions = SetupOptions & {
  readonly maxWriteBytes?: t.NumberBytes;
};

export type ListPayloadInput = Omit<t.Files.Cmd.List.Payload, 'cursor'> & {
  readonly cursor?: t.Files.String.Cursor;
};

export type ReadPayloadInput = Omit<t.Files.Cmd.Read.Payload, 'encoding'> & {
  readonly encoding?: string;
};

type FilesFsBacking = { readonly handlers: t.Files.Cmd.HandlerMap };

export const ROOT = '/root' as t.StringAbsolutePath;

export const allowDocsPolicy = {
  list: 'docs/**',
  stat: 'docs/**',
  read: 'docs/**',
  manifest: true,
} satisfies t.Files.Policy.Shape;

export const allowAllPolicy = {
  list: '**',
  stat: '**',
  read: '**',
  manifest: true,
} satisfies t.Files.Policy.Shape;

export const denyPrivatePolicy = {
  ...allowDocsPolicy,
  deny: 'docs/private/**',
} satisfies t.Files.Policy.Shape;

export const defaultNodes = {
  '/root': { kind: 'dir' },
  '/root/docs': { kind: 'dir' },
  '/root/docs/nested': { kind: 'dir' },
  '/root/docs/nested/guide.md': file('# Guide', 'text/markdown'),
  '/root/docs/private': { kind: 'dir' },
  '/root/docs/private/secret.md': file('secret', 'text/markdown'),
  '/root/docs/readme.md': file('# Readme', 'text/markdown'),
  '/root/public': { kind: 'dir' },
  '/root/public/info.txt': file('public info', 'text/plain'),
  '/root/big.txt': file('0123456789', 'text/plain'),
  '/root/empty.txt': file('', 'text/plain'),
} satisfies NodeMap;

export function file(content: string, mediaType?: t.StringMimeType): FileNode {
  return {
    kind: 'file',
    content,
    size: utf8ByteLength(content),
    ...(mediaType === undefined ? {} : { mediaType }),
  };
}

export function fsFixture(options: FsFixtureOptions = {}): FsFixture {
  const nodes: NodeMap = { ...defaultNodes, ...options.nodes };
  const realPaths = options.realPaths ?? {};
  const calls: FsCalls = {
    realPath: 0,
    stat: 0,
    readText: 0,
    walk: 0,
    lstat: 0,
    ensureDir: 0,
    writeFileAtomic: 0,
    removeEntry: 0,
  };

  const fs: t.FilesFs.Capability.Readonly = {
    Path,

    realPath(input) {
      calls.realPath++;
      const absolute = Path.resolve(input);
      return realPaths[absolute] ?? (nodes[absolute] ? absolute : undefined);
    },

    stat(input) {
      calls.stat++;
      const node = nodes[Path.resolve(input)];
      return node ? statFromNode(node) : undefined;
    },

    readText(input) {
      calls.readText++;
      const node = nodes[Path.resolve(input)];
      return node?.kind === 'file' ? node.content : undefined;
    },

    walk(input) {
      calls.walk++;
      const dir = Path.resolve(input);
      const prefix = dir === '/' ? '/' : `${dir}/`;
      return Object.entries(nodes)
        .filter(([entryPath]) => entryPath !== dir && entryPath.startsWith(prefix))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([entryPath, node]) => ({
          path: entryPath,
          kind: node.kind,
          isFile: node.kind === 'file',
          isDirectory: node.kind === 'dir',
          stat: statFromNode(node),
        }));
    },
  };

  return { fs, root: ROOT, nodes, calls };
}

export function setup(options: SetupOptions = {}) {
  const fixture = fsFixture(options.fs);
  const backing = Files.Fs.Readonly.create({
    fs: fixture.fs,
    root: fixture.root,
    ...(options.policy === undefined ? {} : { policy: options.policy }),
    ...(options.maxReadBytes === undefined ? {} : { maxReadBytes: options.maxReadBytes }),
    ...(options.defaultLimit === undefined ? {} : { defaultLimit: options.defaultLimit }),
  });
  return { ...fixture, backing };
}

export function writableFsFixture(options: FsFixtureOptions = {}): WritableFsFixture {
  const fixture = fsFixture(options);
  const realPaths = options.realPaths ?? {};
  const fs: t.FilesFs.Capability.Writable = {
    ...fixture.fs,

    lstat(input) {
      fixture.calls.lstat++;
      const absolute = Path.resolve(input);
      const real = realPaths[absolute];
      if (real !== undefined && real !== absolute) return { isSymlink: true };
      const node = fixture.nodes[absolute];
      return node ? statFromNode(node) : undefined;
    },

    async ensureDir(input) {
      fixture.calls.ensureDir++;
      const absolute = Path.resolve(input);
      const relative = Path.relative(ROOT, absolute).replaceAll('\\', '/');
      if (relative === '' || relative === '.') return;
      let current = ROOT;
      for (const segment of relative.split('/').filter(Boolean)) {
        current = Path.join(current, segment) as t.StringAbsolutePath;
        const node = fixture.nodes[current];
        if (node?.kind === 'file') throw new Error(`Not a directory: ${current}`);
        fixture.nodes[current] = { kind: 'dir' };
      }
    },

    writeFileAtomic(input, content, options = {}) {
      fixture.calls.writeFileAtomic++;
      const absolute = Path.resolve(input);
      fixture.nodes[absolute] = file(
        new TextDecoder().decode(content),
        options.mediaType,
      );
    },

    removeEntry(input) {
      fixture.calls.removeEntry++;
      const absolute = Path.resolve(input);
      const node = fixture.nodes[absolute];
      if (!node) throw new Error(`Path not found: ${absolute}`);
      if (node.kind === 'dir') {
        const prefix = `${absolute}/`;
        if (Object.keys(fixture.nodes).some((path) => path.startsWith(prefix))) {
          throw new Error(`Directory not empty: ${absolute}`);
        }
      }
      delete fixture.nodes[absolute];
    },
  };

  return { ...fixture, fs };
}

export function setupWritable(options: SetupWritableOptions = {}) {
  const fixture = writableFsFixture(options.fs);
  const backing = Files.Fs.Writable.create({
    fs: fixture.fs,
    root: fixture.root,
    ...(options.policy === undefined ? {} : { policy: options.policy }),
    ...(options.maxReadBytes === undefined ? {} : { maxReadBytes: options.maxReadBytes }),
    ...(options.maxWriteBytes === undefined ? {} : { maxWriteBytes: options.maxWriteBytes }),
    ...(options.defaultLimit === undefined ? {} : { defaultLimit: options.defaultLimit }),
  });
  return { ...fixture, backing };
}

export function escapingFixture(): FsFixtureOptions {
  return {
    nodes: {
      '/root/link-out.txt': file('secret', 'text/plain'),
      '/outside': { kind: 'dir' },
      '/outside/secret.txt': file('secret', 'text/plain'),
    },
    realPaths: {
      '/root/link-out.txt': '/outside/secret.txt' as t.StringAbsolutePath,
    },
  };
}

export const cmd = {
  capabilities(backing: FilesFsBacking) {
    return backing.handlers['files:capabilities']({}, context('files:capabilities'));
  },

  list(backing: FilesFsBacking, payload: ListPayloadInput = {}) {
    return backing.handlers['files:list'](
      payload as t.Files.Cmd.List.Payload,
      context('files:list'),
    );
  },

  stat(backing: FilesFsBacking, payload: t.Files.Cmd.Stat.Payload) {
    return backing.handlers['files:stat'](payload, context('files:stat'));
  },

  read(backing: FilesFsBacking, payload: ReadPayloadInput) {
    return backing.handlers['files:read'](
      payload as t.Files.Cmd.Read.Payload,
      context('files:read'),
    );
  },

  write(backing: FilesFsBacking, payload: t.Files.Cmd.Write.Payload) {
    return backing.handlers['files:write'](payload, context('files:write'));
  },

  remove(backing: FilesFsBacking, payload: t.Files.Cmd.Remove.Payload) {
    return backing.handlers['files:remove'](payload, context('files:remove'));
  },

  watch(backing: FilesFsBacking, payload: t.Files.Cmd.Watch.Payload = {}) {
    return backing.handlers['files:watch'](payload, context('files:watch'));
  },

  manifest(backing: FilesFsBacking, payload: t.Files.Cmd.Manifest.Payload = {}) {
    return backing.handlers['files:manifest'](payload, context('files:manifest'));
  },
};

export function context<K extends t.Files.Cmd.Name>(
  name: K,
): t.Cmd.Handler.Context<t.Files.Cmd.Name, t.Files.Cmd.Event, K> {
  const controller = new AbortController();
  return {
    id: 'req-files-fs-test' as t.Cmd.ReqId,
    name,
    signal: controller.signal,
    emit(_event: t.Files.Cmd.Event[K]) {
      return undefined;
    },
  };
}

export async function expectFilesFsError(
  fn: () => Promise<unknown> | unknown,
  name: t.FilesFs.Error.Kind,
): Promise<Error> {
  try {
    await fn();
  } catch (error) {
    expect(error).to.be.instanceOf(Error);
    const err = error as Error;
    expect(err.name).to.eql(name);
    expect(err.message.includes(ROOT)).to.eql(false);
    expect(err.message.includes('/outside')).to.eql(false);
    return err;
  }
  throw new Error(`Expected ${name}.`);
}

const Path = FilesPath.posix() satisfies TCapability.Path;

function statFromNode(node: Node): TCapability.Stat {
  return {
    kind: node.kind,
    isFile: node.kind === 'file',
    isDirectory: node.kind === 'dir',
    ...(node.kind === 'file' && node.size !== undefined ? { size: node.size } : {}),
    ...(node.kind === 'file' && node.modifiedAt !== undefined
      ? { modifiedAt: node.modifiedAt }
      : {}),
    ...(node.kind === 'file' && node.hash !== undefined ? { hash: node.hash } : {}),
    ...(node.kind === 'file' && node.mediaType !== undefined ? { mediaType: node.mediaType } : {}),
  };
}
