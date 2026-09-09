import { expect, type t } from '../../-test.ts';
import { Files } from '../../m.files/mod.ts';
import { FilesMemory } from '../mod.ts';

export const allowAllPolicy = Files.Policy.readonly('**');

export const allowAllMutablePolicy = {
  list: '**',
  stat: '**',
  read: '**',
  write: '**',
  remove: '**',
  watch: '**',
  manifest: true,
} satisfies t.Files.Policy.Shape;

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
} satisfies t.Files.Source.TextFileMap;

export type SetupOptions = Omit<t.FilesMemory.Options, 'files' | 'dirs' | 'policy'> & {
  readonly files?: t.Files.Source.TextFileMap;
  readonly dirs?: readonly t.Files.String.Path[];
  readonly policy?: t.Files.Policy.Shape;
};

export type ListPayloadInput = Omit<t.Files.Cmd.List.Payload, 'cursor'> & {
  readonly cursor?: t.Files.String.Cursor;
};

export type ReadPayloadInput = Omit<t.Files.Cmd.Read.Payload, 'encoding'> & {
  readonly encoding?: string;
};

export function setup(options: SetupOptions = {}) {
  const backing = FilesMemory.Readonly.create({
    files: options.files ?? defaultFiles,
    dirs: options.dirs ?? ['empty'],
    policy: options.policy ?? allowAllPolicy,
    ...(options.maxReadBytes === undefined ? {} : { maxReadBytes: options.maxReadBytes }),
    ...(options.defaultLimit === undefined ? {} : { defaultLimit: options.defaultLimit }),
  });
  return { backing };
}

type MemoryBacking = t.FilesMemory.Readonly | t.FilesMemory.Writable | t.FilesMemory.Live;

export const cmd = {
  capabilities(backing: MemoryBacking) {
    return backing.handlers['files:capabilities']({}, context('files:capabilities'));
  },

  list(backing: MemoryBacking, payload: ListPayloadInput = {}) {
    return backing.handlers['files:list'](
      payload as t.Files.Cmd.List.Payload,
      context('files:list'),
    );
  },

  stat(backing: MemoryBacking, payload: t.Files.Cmd.Stat.Payload) {
    return backing.handlers['files:stat'](payload, context('files:stat'));
  },

  read(backing: MemoryBacking, payload: ReadPayloadInput) {
    return backing.handlers['files:read'](
      payload as t.Files.Cmd.Read.Payload,
      context('files:read'),
    );
  },

  write(backing: MemoryBacking, payload: t.Files.Cmd.Write.Payload) {
    return backing.handlers['files:write'](payload, context('files:write'));
  },

  remove(backing: MemoryBacking, payload: t.Files.Cmd.Remove.Payload) {
    return backing.handlers['files:remove'](payload, context('files:remove'));
  },

  watch(backing: MemoryBacking, payload: t.Files.Cmd.Watch.Payload = {}) {
    return backing.handlers['files:watch'](payload, context('files:watch'));
  },

  manifest(backing: MemoryBacking, payload: t.Files.Cmd.Manifest.Payload = {}) {
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
