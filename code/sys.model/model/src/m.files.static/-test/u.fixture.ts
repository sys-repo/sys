import { expect, type t } from '../../-test.ts';
import { Files } from '../../m.files/mod.ts';
import { FilesStatic } from '../mod.ts';

const HASHES = {
  digest: `sha256-${'0'.repeat(64)}`,
  foo: `sha256-${'1'.repeat(64)}`,
  baz: `sha256-${'2'.repeat(64)}`,
  secret: `sha256-${'3'.repeat(64)}`,
  docs: `sha256-${'4'.repeat(64)}`,
} as const satisfies Record<string, t.StringHash>;

export const baseUrl = 'https://example.test/data/' as t.StringUrl;
export const buildTime = 1_700_000_000_000 as t.UnixTimestamp;
export const allowAllPolicy = Files.Policy.readonly('**');

export const sampleDist = dist({
  'foo.json': `${HASHES.foo}:size=16`,
  'notes/baz.md': `${HASHES.baz}:size=6`,
  'private/secret.txt': `${HASHES.secret}:size=5`,
});

export type SetupOptions = Omit<t.FilesStatic.FromDistOptions, 'dist' | 'policy'> & {
  readonly dist?: t.DistPkg;
  readonly policy?: t.Files.Policy.Shape;
};

export type ListPayloadInput = Omit<t.Files.Cmd.List.Payload, 'cursor'> & {
  readonly cursor?: t.Files.String.Cursor;
};

export function setup(options: SetupOptions = {}) {
  const backing = FilesStatic.fromDist({
    dist: options.dist ?? sampleDist,
    ...('baseUrl' in options ? { baseUrl: options.baseUrl } : { baseUrl }),
    policy: options.policy ?? allowAllPolicy,
    ...(options.defaultLimit === undefined ? {} : { defaultLimit: options.defaultLimit }),
  });
  return { backing };
}

export const cmd = {
  capabilities(backing: t.FilesStatic.Readonly) {
    return backing.handlers['files:capabilities']({}, context('files:capabilities'));
  },

  list(backing: t.FilesStatic.Readonly, payload: ListPayloadInput = {}) {
    return backing.handlers['files:list'](
      payload as t.Files.Cmd.List.Payload,
      context('files:list'),
    );
  },

  stat(backing: t.FilesStatic.Readonly, payload: t.Files.Cmd.Stat.Payload) {
    return backing.handlers['files:stat'](payload, context('files:stat'));
  },

  read(backing: t.FilesStatic.Readonly, payload: t.Files.Cmd.Read.Payload) {
    return backing.handlers['files:read'](payload, context('files:read'));
  },

  watch(backing: t.FilesStatic.Readonly, payload: t.Files.Cmd.Watch.Payload = {}) {
    return backing.handlers['files:watch'](payload, context('files:watch'));
  },

  manifest(backing: t.FilesStatic.Readonly, payload: t.Files.Cmd.Manifest.Payload = {}) {
    return backing.handlers['files:manifest'](payload, context('files:manifest'));
  },
};

export function dist(parts: t.CompositeHashParts): t.DistPkg {
  return {
    type: 'https://jsr.io/@sys/types/0.0.0/src/types/t.Pkg.dist.ts',
    build: {
      time: buildTime,
      size: { total: 27, pkg: 0 },
      builder: 'fixture@0.0.0',
      runtime: 'deno=fixture',
      hash: { policy: 'fixture:dist-policy' },
    },
    hash: {
      digest: HASHES.digest,
      parts,
    },
  };
}

export function part(hash: t.StringHash, size?: number): t.StringFileHashUri {
  return size === undefined ? hash : `${hash}:size=${size}`;
}

export function context<K extends t.Files.Cmd.Name>(
  name: K,
): t.Cmd.Handler.Context<t.Files.Cmd.Name, t.Files.Cmd.Event, K> {
  const controller = new AbortController();
  return {
    id: 'req-files-static-test' as t.Cmd.ReqId,
    name,
    signal: controller.signal,
    emit(_event: t.Files.Cmd.Event[K]) {
      return undefined;
    },
  };
}

export async function expectFilesStaticError(
  fn: () => Promise<unknown> | unknown,
  name: t.FilesStatic.Error.Kind,
): Promise<Error> {
  try {
    await fn();
  } catch (error) {
    expect(error).to.be.instanceOf(Error);
    const err = error as Error;
    expect(err.name).to.eql(name);
    expect(err.message.includes(baseUrl)).to.eql(false);
    return err;
  }
  throw new Error(`Expected ${name}.`);
}

export const Hash = HASHES;
