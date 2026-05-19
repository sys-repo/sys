import { expect, type t } from '../../-test.ts';
import { Files } from '../../m.files/mod.ts';
import { FilesMemory } from '../mod.ts';

export const allowAllPolicy = Files.Policy.readonly('**');

export const defaultFiles = {
  'foo.json': {
    content: '{ "foo": true }\n',
    mediaType: 'application/json',
  },
  'bar.yaml': {
    content: 'bar: true\n',
    mediaType: 'application/yaml',
  },
  'notes/baz.md': {
    content: '# Baz\n',
    mediaType: 'text/markdown',
  },
} satisfies t.FilesMemory.FileMap;

export type SetupOptions = Omit<t.FilesMemory.ReadonlyOptions, 'files' | 'dirs' | 'policy'> & {
  readonly files?: t.FilesMemory.FileMap;
  readonly dirs?: readonly t.Files.StringPath[];
  readonly policy?: t.Files.Policy.Shape;
};

export type ListPayloadInput = Omit<t.Files.Cmd.List.Payload, 'cursor'> & {
  readonly cursor?: t.Files.StringCursor;
};

export type ReadPayloadInput = Omit<t.Files.Cmd.Read.Payload, 'encoding'> & {
  readonly encoding?: string;
};

export function setup(options: SetupOptions = {}) {
  const backing = FilesMemory.readonly({
    files: options.files ?? defaultFiles,
    dirs: options.dirs ?? ['empty'],
    policy: options.policy ?? allowAllPolicy,
    ...(options.maxReadBytes === undefined ? {} : { maxReadBytes: options.maxReadBytes }),
    ...(options.defaultLimit === undefined ? {} : { defaultLimit: options.defaultLimit }),
  });
  return { backing };
}

export const cmd = {
  capabilities(backing: t.FilesMemory.Readonly) {
    return backing.handlers['files:capabilities']({}, context('files:capabilities'));
  },

  list(backing: t.FilesMemory.Readonly, payload: ListPayloadInput = {}) {
    return backing.handlers['files:list'](
      payload as t.Files.Cmd.List.Payload,
      context('files:list'),
    );
  },

  stat(backing: t.FilesMemory.Readonly, payload: t.Files.Cmd.Stat.Payload) {
    return backing.handlers['files:stat'](payload, context('files:stat'));
  },

  read(backing: t.FilesMemory.Readonly, payload: ReadPayloadInput) {
    return backing.handlers['files:read'](
      payload as t.Files.Cmd.Read.Payload,
      context('files:read'),
    );
  },

  watch(backing: t.FilesMemory.Readonly, payload: t.Files.Cmd.Watch.Payload = {}) {
    return backing.handlers['files:watch'](payload, context('files:watch'));
  },

  manifest(backing: t.FilesMemory.Readonly, payload: t.Files.Cmd.Manifest.Payload = {}) {
    return backing.handlers['files:manifest'](payload, context('files:manifest'));
  },
};

export function context<K extends t.Files.Cmd.Name>(
  name: K,
): t.Cmd.Handler.Context<t.Files.Cmd.Name, t.Files.Cmd.Event, K> {
  const controller = new AbortController();
  return {
    id: 'req-files-memory-test' as t.Cmd.ReqId,
    name,
    signal: controller.signal,
    emit(_event: t.Files.Cmd.Event[K]) {
      return undefined;
    },
  };
}

export async function expectFilesMemoryError(
  fn: () => Promise<unknown> | unknown,
  name: t.FilesMemory.Error.Kind,
): Promise<Error> {
  try {
    await fn();
  } catch (error) {
    expect(error).to.be.instanceOf(Error);
    const err = error as Error;
    expect(err.name).to.eql(name);
    expect(err.message.includes('/memory')).to.eql(false);
    return err;
  }
  throw new Error(`Expected ${name}.`);
}
