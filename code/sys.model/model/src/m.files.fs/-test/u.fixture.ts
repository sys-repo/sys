import { expect, type t } from '../../-test.ts';
import { utf8ByteLength } from '../../m.files/u.bytes.ts';
import { FilesPath } from '../../m.files/u.path.ts';
import { FilesFs } from '../mod.ts';

export const ROOT = '/root' as t.StringAbsolutePath;

export type FileNode = {
  readonly kind: 'file';
  readonly content: string;
  readonly size?: t.NumberBytes;
  readonly modified?: t.StringIsoDate;
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
};

export type FsFixture = {
  readonly fs: t.FilesFs.Capability.Readonly;
  readonly root: t.StringAbsolutePath;
  readonly nodes: NodeMap;
  readonly calls: FsCalls;
};

export type SetupOptions = {
  readonly fs?: FsFixtureOptions;
  readonly policy?: t.Files.Policy.Shape;
  readonly maxReadBytes?: t.NumberBytes;
  readonly defaultLimit?: t.Files.Limit;
};

export type ListPayloadInput = Omit<t.Files.Cmd.List.Payload, 'cursor'> & {
  readonly cursor?: t.Files.StringCursor;
};

export type ReadPayloadInput = Omit<t.Files.Cmd.Read.Payload, 'encoding'> & {
  readonly encoding?: string;
};

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
  const calls: FsCalls = { realPath: 0, stat: 0, readText: 0, walk: 0 };

  const fs: t.FilesFs.Capability.Readonly = {
    path,

    realPath(input) {
      calls.realPath++;
      const absolute = path.resolve(input);
      return realPaths[absolute] ?? (nodes[absolute] ? absolute : undefined);
    },

    stat(input) {
      calls.stat++;
      const node = nodes[path.resolve(input)];
      return node ? statFromNode(node) : undefined;
    },

    readText(input) {
      calls.readText++;
      const node = nodes[path.resolve(input)];
      return node?.kind === 'file' ? node.content : undefined;
    },

    walk(input) {
      calls.walk++;
      const dir = path.resolve(input);
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
  const backing = FilesFs.readonly({
    fs: fixture.fs,
    root: fixture.root,
    ...(options.policy === undefined ? {} : { policy: options.policy }),
    ...(options.maxReadBytes === undefined ? {} : { maxReadBytes: options.maxReadBytes }),
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
  capabilities(backing: t.FilesFs.Readonly) {
    return backing.handlers['files:capabilities']({}, context('files:capabilities'));
  },

  list(backing: t.FilesFs.Readonly, payload: ListPayloadInput = {}) {
    return backing.handlers['files:list'](
      payload as t.Files.Cmd.List.Payload,
      context('files:list'),
    );
  },

  stat(backing: t.FilesFs.Readonly, payload: t.Files.Cmd.Stat.Payload) {
    return backing.handlers['files:stat'](payload, context('files:stat'));
  },

  read(backing: t.FilesFs.Readonly, payload: ReadPayloadInput) {
    return backing.handlers['files:read'](
      payload as t.Files.Cmd.Read.Payload,
      context('files:read'),
    );
  },

  watch(backing: t.FilesFs.Readonly, payload: t.Files.Cmd.Watch.Payload = {}) {
    return backing.handlers['files:watch'](payload, context('files:watch'));
  },

  manifest(backing: t.FilesFs.Readonly, payload: t.Files.Cmd.Manifest.Payload = {}) {
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

const path: t.FilesFs.Capability.Path = FilesPath.posix();

function statFromNode(node: Node): t.FilesFs.Capability.Stat {
  return {
    kind: node.kind,
    isFile: node.kind === 'file',
    isDirectory: node.kind === 'dir',
    ...(node.kind === 'file' && node.size !== undefined ? { size: node.size } : {}),
    ...(node.kind === 'file' && node.modified !== undefined ? { modified: node.modified } : {}),
    ...(node.kind === 'file' && node.hash !== undefined ? { hash: node.hash } : {}),
    ...(node.kind === 'file' && node.mediaType !== undefined ? { mediaType: node.mediaType } : {}),
  };
}
