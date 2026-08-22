import { describe, expect, expectTypeOf, it, Num, type t, Time } from '../../../-test.ts';
import { Fs } from '../../../mod.ts';
import { createRooted } from '../u/u.create.ts';
import {
  DEFAULT_IO,
  type FileHandle,
  type Io,
  type ModeHandle,
  type ReadHandle,
  withIo,
} from '../u/u.io.ts';

export { createRooted, DEFAULT_IO, describe, expect, expectTypeOf, Fs, it, Num, Time, withIo };
export type { FileHandle, Io, ModeHandle, ReadHandle, t };

export type Fixture = {
  readonly workspace: t.StringAbsoluteDir;
  readonly root: t.StringAbsoluteDir;
  readonly outside: t.StringAbsoluteDir;
};

export async function setup(): Promise<Fixture> {
  const workspace = (await Deno.makeTempDir({
    dir: Deno.cwd(),
    prefix: '.tmp-fs-rooted-',
  })) as t.StringAbsoluteDir;
  return {
    workspace,
    root: Fs.join(workspace, 'root') as t.StringAbsoluteDir,
    outside: Fs.join(workspace, 'outside') as t.StringAbsoluteDir,
  };
}

export async function teardown(fixture: Fixture): Promise<void> {
  await Deno.remove(fixture.workspace, { recursive: true }).catch(() => undefined);
}

export function wrapFile(
  file: FileHandle,
  overrides: Partial<FileHandle> = {},
): FileHandle {
  return {
    write: (data) => file.write(data),
    read: (data) => file.read(data),
    sync: () => file.sync(),
    stat: () => file.stat(),
    tryLock: (exclusive) => file.tryLock(exclusive),
    unlock: () => file.unlock(),
    close: () => file.close(),
    ...overrides,
  };
}

export function wrapReadHandle(
  file: ReadHandle,
  overrides: Partial<ReadHandle> = {},
): ReadHandle {
  return {
    read: (data) => file.read(data),
    stat: () => file.stat(),
    close: () => file.close(),
    ...overrides,
  };
}

export function wrapModeHandle(
  file: ModeHandle,
  overrides: Partial<ModeHandle> = {},
): ModeHandle {
  return {
    stat: () => file.stat(),
    chmod: (mode) => file.chmod(mode),
    close: () => file.close(),
    ...overrides,
  };
}

export async function expectFailure(
  fn: () => Promise<unknown>,
  kind: t.FsRooted.FailureKind,
  committed = false,
): Promise<t.FsRooted.Failure> {
  try {
    await fn();
  } catch (error) {
    expect(Fs.Capability.Rooted.Is.failure(error)).to.eql(true);
    const failure = error as t.FsRooted.Failure;
    expect(failure.kind).to.eql(kind);
    expect(failure.committed).to.eql(committed);
    return failure;
  }
  throw new Error(`Expected FsRootedError: ${kind}`);
}
