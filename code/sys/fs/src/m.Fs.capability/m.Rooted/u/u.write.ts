import { Is, Num, Obj, Schedule, ServerIs, StdPath, type t } from '../common.ts';
import { claimWriter } from './u.activity.ts';
import { failure, isFailure } from './u.error.ts';
import type { FileHandle, Io } from './u.io.ts';
import { type Identity, identityRequired, lstatMaybe, sameIdentity } from './u.path.ts';
import { type StageState, validateActive } from './u.stage.ts';
import { byteLengthOf, copyTreeChunk, treeChunkTail } from './u.write.bytes.ts';
import { treeWriteInput } from './u.write.input.ts';
import { treeWriteOperation, treeWriteStart } from './u.write.operation.ts';

type Constructed = {
  readonly kind: 'file' | 'directory';
  readonly identity: Identity;
  readonly size?: number;
};
type Source = { readonly iterator: object; readonly next: () => unknown };
type Yield = { readonly done: boolean; readonly value: unknown };
const prototypeOf = Object.getPrototypeOf;
const descriptorOf = Object.getOwnPropertyDescriptor;
const objectPrototype = Object.prototype;
const apply = Reflect.apply;

/** Fulfil one stage-owned construction claim; publication and cleanup keep their existing owners. */
export async function writeTree(
  baseIo: Io,
  stage: StageState,
  entries: readonly t.FsRooted.TreeEntry[],
  options: t.FsRooted.TreeWriteOptions,
): Promise<void> {
  const started = treeWriteStart();
  let input: t.RootedTreeInput;
  try {
    input = treeWriteInput(entries, options);
  } catch (cause) {
    // Admission executes no producer; normalize Rooted lexical failures to this operation.
    throw failure('write-tree', isFailure(cause) ? cause.kind : 'invalid-target', { cause });
  }
  const context = treeWriteOperation(input.options, stage.activity, started);
  const io = checkpointIo(baseIo, context);
  let release: (() => void) | undefined;
  let pending: t.FsRooted.Failure | undefined;
  try {
    // Lifecycle adapters may queue a synchronous terminal emission during construction.
    await Schedule.micro();
    context.check();
    try {
      release = claimWriter(stage.activity);
    } catch (cause) {
      throw context.fail('invalid-state', cause);
    }
    await context.host(() => construct(io, stage, input, context));
    context.check();
  } catch (cause) {
    pending = context.fail('io-failure', cause);
  } finally {
    try {
      await context.dispose();
      context.check();
    } catch (cause) {
      pending = context.fail('io-failure', cause);
    }
    if (release) {
      stage.activity.writer = pending ? 'failed' : 'complete';
      release();
    }
  }
  if (pending) throw pending;
}

async function construct(
  io: Io,
  stage: StageState,
  input: t.RootedTreeInput,
  context: t.RootedWriteContext,
): Promise<void> {
  await validateActive(io, stage, 'write-tree');
  for await (const _entry of io.readDir(stage.content)) {
    throw context.fail('invalid-state');
  }
  await validateActive(io, stage, 'write-tree');
  const constructed = new Map<string, Constructed>([
    ['', { kind: 'directory', identity: stage.contentIdentity }],
  ]);
  const directories = new Set([`${stage.contentIdentity.dev}:${stage.contentIdentity.ino}`]);
  let actual = 0;
  const consume = (count: number, fileBytes: number, expected: number) => {
    const limits = input.options;
    if (count > limits.maxFileBytes - fileBytes || count > limits.maxTreeBytes - actual) {
      throw context.fail('limit-exceeded');
    }
    if (count > expected - fileBytes) throw context.fail('producer-failure');
    actual += count;
  };

  for (const entry of input.directories) {
    const path = StdPath.join(stage.content, entry.path);
    await parents(entry.path);
    if (await lstatMaybe(io, path, 'write-tree')) throw context.fail('ownership-lost');
    await io.mkdir(path, { mode: 0o700 });
    const info = await lstatMaybe(io, path, 'write-tree');
    if (!info?.isDirectory || info.isSymlink) throw context.fail('ownership-lost');
    const identity = identityRequired(info, 'write-tree');
    const key = `${identity.dev}:${identity.ino}`;
    if (identity.dev !== stage.contentIdentity.dev || directories.has(key)) {
      throw context.fail('unsafe-filesystem');
    }
    directories.add(key);
    constructed.set(entry.path, { kind: 'directory', identity });
  }
  for (const entry of input.entries) {
    if (entry.kind !== 'file') continue;
    await parents(entry.path);
    const path = StdPath.join(stage.content, entry.path);
    if (await lstatMaybe(io, path, 'write-tree')) throw context.fail('ownership-lost');
    const identity = await writeFile(io, path, entry, stage.contentIdentity.dev, consume, context);
    constructed.set(entry.path, { kind: 'file', identity, size: entry.expectedBytes });
  }

  // Identities prove construction, not cleanup ownership. Discard owns current container descendants.
  await validateActive(io, stage, 'write-tree');
  const children = new Map<string, Set<string>>();
  for (const [path, entry] of constructed) {
    if (entry.kind === 'directory') children.set(path, new Set());
  }
  for (const path of constructed.keys()) {
    if (!path) continue;
    const separator = path.lastIndexOf('/');
    children.get(separator < 0 ? '' : path.slice(0, separator))!.add(path);
  }
  for (const [path, expected] of constructed) {
    await verify(path, expected);
    if (expected.kind !== 'directory') continue;
    const remaining = new Set(children.get(path));
    for await (const child of io.readDir(StdPath.join(stage.content, path))) {
      const relative = path ? `${path}/${child.name}` : child.name;
      if (!remaining.delete(relative)) throw context.fail('ownership-lost');
    }
    if (remaining.size !== 0) throw context.fail('ownership-lost');
    await verify(path, expected);
  }
  await validateActive(io, stage, 'write-tree');

  async function verify(path: string, expected: Constructed): Promise<void> {
    const info = await lstatMaybe(io, StdPath.join(stage.content, path), 'write-tree');
    assertEntry(info, expected, context);
  }
  async function parents(path: string): Promise<void> {
    await validateActive(io, stage, 'write-tree');
    let separator = path.indexOf('/');
    // Walk admitted prefixes only; no parent is created implicitly.
    while (separator >= 0) {
      const parent = path.slice(0, separator);
      const expected = constructed.get(parent);
      if (!expected || expected.kind !== 'directory') throw context.fail('ownership-lost');
      await verify(parent, expected);
      separator = path.indexOf('/', separator + 1);
    }
  }
}

async function writeFile(
  io: Io,
  path: string,
  entry: t.FsRooted.TreeFile,
  device: number,
  consume: (count: number, fileBytes: number, expected: number) => void,
  context: t.RootedWriteContext,
): Promise<Identity> {
  let source: Source | undefined;
  let file: FileHandle | undefined;
  let identity: Identity | undefined;
  let pending: t.FsRooted.Failure | undefined;
  try {
    await context.producer(() => {
      const content: unknown = entry.content;
      if (!Is.object(content) && !Is.func(content)) {
        throw new TypeError('Expected an async iterable');
      }
      const method = Reflect.get(content, Symbol.asyncIterator);
      if (!Is.func(method)) throw new TypeError('Expected an async iterator method');
      const iterator: unknown = apply(method, content, []);
      if (!Is.object(iterator)) throw new TypeError('Expected an iterator object');
      // Retain the iterator before looking up next, so acquisition faults still permit return.
      source = {
        iterator,
        next: () => {
          throw new TypeError('Invalid next method');
        },
      };
      const next = Reflect.get(iterator, 'next');
      if (!Is.func(next)) throw new TypeError('Expected a next method');
      source = { iterator, next: () => apply(next, iterator, []) };
    });
    file = await io.open(path, { write: true, createNew: true, mode: 0o600 });
    const opened = await file.stat();
    identity = identityRequired(opened, 'write-tree');
    if (identity.dev !== device) throw context.fail('unsafe-filesystem');
    assertEntry(opened, { kind: 'file', identity, size: 0 }, context);
    let count = 0;
    while (true) {
      const result = await context.producer(source!.next);
      context.check();
      let yielded: Yield;
      let chunk: Uint8Array | undefined;
      try {
        yielded = iteratorResult(result);
        if (!yielded.done) chunk = copyTreeChunk(yielded.value);
      } catch (cause) {
        throw context.fail('producer-failure', cause);
      }
      context.check();
      if (yielded.done) {
        if (count !== entry.expectedBytes) throw context.fail('producer-failure');
        break;
      }
      const bytes = chunk!;
      const length = byteLengthOf(bytes);
      consume(length, count, entry.expectedBytes);
      count += length;
      let offset = 0;
      // The descriptor can short-write; the whole chunk was copied before the first write await.
      while (offset < length) {
        const written = await file.write(treeChunkTail(bytes, offset));
        if (!Num.Is.safeInt(written) || written <= 0 || written > length - offset) {
          throw context.fail('io-failure');
        }
        offset += written;
      }
    }
    await file.sync();
    assertEntry(await file.stat(), { kind: 'file', identity, size: entry.expectedBytes }, context);
  } catch (cause) {
    pending = context.fail(isFailure(cause) ? cause.kind : 'io-failure', cause);
  } finally {
    if (file) {
      try {
        file.close();
      } catch (cause) {
        pending = context.fail('io-failure', cause);
      }
    }
    if (pending && source) {
      // Terminal selection has already revoked all future write checkpoints.
      const iterator = source.iterator;
      await context.cleanup(async () => {
        const method = Reflect.get(iterator, 'return');
        if (method === undefined) return;
        if (!Is.func(method)) throw new TypeError('Expected a return method');
        iteratorResult(await apply(method, iterator, []));
      });
    }
  }
  if (pending) throw pending;
  if (!identity) throw context.fail('io-failure');
  assertEntry(await lstatMaybe(io, path, 'write-tree'), {
    kind: 'file',
    identity,
    size: entry.expectedBytes,
  }, context);
  return identity;
}

function iteratorResult(input: unknown): Yield {
  if (!Is.object(input) || ServerIs.Native.proxy(input) || prototypeOf(input) !== objectPrototype) {
    throw new TypeError('Expected an ordinary iterator result');
  }
  const done = descriptorOf(input, 'done');
  const value = descriptorOf(input, 'value');
  if ((done && !Obj.hasOwn(done, 'value')) || (value && !Obj.hasOwn(value, 'value'))) {
    throw new TypeError('Iterator result accessors are not admitted');
  }
  if (done?.value !== undefined && !Is.bool(done.value)) {
    throw new TypeError('Invalid iterator done flag');
  }
  return { done: done?.value === true, value: value?.value };
}

function assertEntry(
  info: Deno.FileInfo | undefined,
  expected: Constructed,
  context: t.RootedWriteContext,
): void {
  if (
    !info || info.isSymlink || !sameIdentity(expected.identity, info) ||
    (expected.kind === 'file' ? !info.isFile : !info.isDirectory)
  ) {
    throw context.fail('ownership-lost');
  }
  if (expected.kind === 'file') {
    if (!Num.Is.safeInt(info.nlink) || info.nlink <= 0) throw context.fail('unsupported');
    if (info.nlink !== 1) throw context.fail('unsafe-filesystem');
    if (info.size !== expected.size) throw context.fail('ownership-lost');
  }
}

/** Check every used host boundary without skipping cleanup or losing a late-opened descriptor. */
function checkpointIo(io: Io, context: t.RootedWriteContext): Io {
  return {
    ...io,
    async lstat(path) {
      context.check();
      try {
        const info = await io.lstat(path);
        context.check();
        return info;
      } catch (cause) {
        context.check();
        // NotFound remains available to Rooted's optional-observation helper.
        throw cause;
      }
    },
    async *readDir(path) {
      context.check();
      for await (const entry of io.readDir(path)) {
        context.check();
        yield entry;
        context.check();
      }
      context.check();
    },
    mkdir: (path, options) => context.host(() => createAt(path, () => io.mkdir(path, options))),
    async open(path, options) {
      let file: FileHandle | undefined;
      try {
        await context.host(async () => {
          file = options?.createNew
            ? await createAt(path, () => io.open(path, options))
            : await io.open(path, options);
        });
      } catch (cause) {
        // A timeout after open must not orphan the returned handle.
        try {
          file?.close();
        } catch { /* activityIo retains unproved closure. */ }
        throw cause;
      }
      const opened = file!;
      return {
        read: (bytes) => context.host(() => opened.read(bytes)),
        write: (bytes) => context.host(() => opened.write(bytes)),
        stat: () => context.host(() => opened.stat()),
        sync: () => context.host(() => opened.sync()),
        tryLock: (exclusive) => context.host(() => opened.tryLock(exclusive)),
        unlock: () => context.host(() => opened.unlock()),
        close() {
          // Close remains synchronous and cleanup-capable after terminal selection.
          opened.close();
          context.check();
        },
      };
    },
  };

  async function createAt<T>(path: string, fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      context.changed();
      return result;
    } catch (cause) {
      const primary = context.fail(
        cause instanceof Deno.errors.NotSupported ? 'unsupported' : 'io-failure',
        cause,
      );
      // The admitted path was absent. Observe possible mutation even after logical cancellation;
      // an unavailable reconciliation is conservatively committed, never inferred absent.
      try {
        await io.lstat(path);
        context.changed();
      } catch (observed) {
        if (!(observed instanceof Deno.errors.NotFound)) context.changed();
      }
      throw context.fail(primary.kind);
    }
  }
}
