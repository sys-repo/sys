import { describe, expect, expectTypeOf, it, Num, type t, Time } from '../../../-test.ts';
import { Fs } from '../../../mod.ts';
import { createRooted } from '../u/u.create.ts';
import { DEFAULT_IO, type FileHandle, type Io, type ModeHandle, withIo } from '../u/u.io.ts';

export { createRooted, DEFAULT_IO, describe, expect, expectTypeOf, Fs, it, Num, Time, withIo };
export type { FileHandle, Io, ModeHandle, t };

export type Fixture = {
  readonly workspace: t.StringAbsoluteDir;
  readonly root: t.StringAbsoluteDir;
  readonly outside: t.StringAbsoluteDir;
};

export async function setup(): Promise<Fixture> {
  const dir = Fs.Path.fromFileUrl(new URL('../../../../.tmp/fs-rooted/', import.meta.url));
  await Deno.mkdir(dir, { recursive: true });
  const { absolute: workspace } = await Fs.makeTempDir({ dir, prefix: 'fs-' });
  return {
    workspace,
    root: Fs.join(workspace, 'root'),
    outside: Fs.join(workspace, 'outside'),
  };
}

export async function teardown(fixture: Fixture): Promise<void> {
  await removeFixture(fixture.workspace);
}

/** Dispose settled test-owned trees; concurrent path replacement is outside this helper's contract. */
async function removeFixture(path: string): Promise<void> {
  const info = await Fs.lstat(path);
  if (!info) return;

  if (info.isDirectory && !info.isSymlink) {
    // Sealing removes directory write access. Restore owner access only for fixture disposal.
    // Never chmod files: they may be hard-linked to a preserved fixture outside this tree.
    if (Deno.build.os !== 'windows' && info.mode !== null && (info.mode & 0o700) !== 0o700) {
      await Deno.chmod(path, (info.mode & 0o7777) | 0o700);
    }
    for await (const entry of Deno.readDir(path)) {
      await removeFixture(Fs.join(path, entry.name));
    }
  }
  await Deno.remove(path);
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
