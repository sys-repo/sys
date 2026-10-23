import type { t as PublicServerTypes } from '@sys/testing/server';
import type {
  TestConnectionResponse,
  TestingDir,
  TestingDirOptions,
  TestingServer as PublicTestingServer,
  TestingServerLib,
} from '@sys/testing/t';
import type { t as PublicEntryTypes } from '../mod.ts';
import { describe, expectTypeOf, Fs, Is, it, type t, Testing } from './common.ts';
import { createWithTmpDir } from '../u/u.withTmpDir.ts';

describe('TestingServer type contracts', () => {
  it('public owner → named operations and compatibility projections', () => {
    expectTypeOf(Testing).toEqualTypeOf<PublicTestingServer.Lib>();
    expectTypeOf(Testing.dir).toEqualTypeOf<PublicTestingServer.Dir>();
    expectTypeOf(Testing.withTmpDir).toEqualTypeOf<PublicTestingServer.WithTmpDir>();
    expectTypeOf(Testing.connect).toEqualTypeOf<PublicTestingServer.Connect>();
    expectTypeOf(Testing).toEqualTypeOf<TestingServerLib>();
    expectTypeOf(Testing.dir).toEqualTypeOf<
      (dirname: t.StringDir, options?: TestingDirOptions) => Promise<TestingDir>
    >();
    expectTypeOf(Testing.connect).toEqualTypeOf<
      (
        port: t.PortNumber,
        options?: PublicTestingServer.Connect.Options,
      ) => Promise<TestConnectionResponse>
    >();
  });

  it('strict operation variance → rejects narrowed replacements', () => {
    const connect443 = (_port: 443): Promise<PublicTestingServer.Connect.Result> => {
      return Promise.resolve({ ok: false, refused: true, elapsed: 0, address: {} });
    };
    // @ts-expect-error A replacement must accept every port, not only 443.
    expectTypeOf(connect443).toMatchTypeOf<PublicTestingServer.Connect>();
    // @ts-expect-error The flat alias retains the canonical contract's strict variance.
    expectTypeOf(connect443).toMatchTypeOf<TestingServerLib['connect']>();
  });

  it('scoped pool → filesystem contract and arbitrary failure values', () => {
    expectTypeOf(createWithTmpDir).toEqualTypeOf<
      (io: t.TestingServer.WithTmpDir.Io) => PublicTestingServer.WithTmpDir
    >();
    const io: t.TestingServer.WithTmpDir.Io = {
      makeTempDir: Fs.makeTempDir,
      realPath: Fs.realPath,
      remove: Fs.remove,
    };
    expectTypeOf(io).toEqualTypeOf<
      Readonly<Pick<t.Fs.Lib, 'makeTempDir' | 'realPath' | 'remove'>>
    >();
    const states: t.TestingServer.WithTmpDir.Execution<number>[] = [
      { ok: true, value: 42 },
      { ok: false, error: undefined },
      { ok: false, error: null },
      { ok: false, error: false },
      { ok: false, error: 0 },
    ];
    expectTypeOf(states).toEqualTypeOf<
      (
        | { readonly ok: true; readonly value: number }
        | { readonly ok: false; readonly error: unknown }
      )[]
    >();
    for (const state of states) {
      if (!state.ok) {
        // @ts-expect-error Unknown failures require narrowing before string use; any must fail here.
        expectTypeOf(state.error).toMatchTypeOf<string>();
        if (Is.string(state.error)) expectTypeOf(state.error).toEqualTypeOf<string>();
      }
    }
  });

  it('public type root → excludes internal lifetime contracts', () => {
    expectTypeOf(Testing).toEqualTypeOf<PublicTestingServer.Lib>();
    expectTypeOf(Testing.withTmpDir).toEqualTypeOf<PublicTestingServer.WithTmpDir>();
    expectTypeOf({ prefix: 'fixture.' }).toMatchTypeOf<PublicTestingServer.WithTmpDir.Options>();
    // @ts-expect-error Filesystem injection belongs only to the scoped internal pool.
    expectTypeOf<PublicTestingServer.WithTmpDir.Io[]>([]);
    // @ts-expect-error Execution bookkeeping belongs only to the scoped internal pool.
    expectTypeOf<PublicTestingServer.WithTmpDir.Execution<number>[]>([]);
  });

  it('runtime entries → retain the public type pool', () => {
    expectTypeOf(Testing).toEqualTypeOf<PublicEntryTypes.TestingServer.Lib>();
    expectTypeOf(Testing.withTmpDir).toEqualTypeOf<PublicEntryTypes.TestingServer.WithTmpDir>();
    expectTypeOf({ prefix: 'fixture.' }).toMatchTypeOf<
      PublicEntryTypes.TestingServer.WithTmpDir.Options
    >();
    expectTypeOf(Testing).toEqualTypeOf<PublicServerTypes.TestingServer.Lib>();
    expectTypeOf(Testing.withTmpDir).toEqualTypeOf<PublicServerTypes.TestingServer.WithTmpDir>();
    expectTypeOf({ prefix: 'fixture.' }).toMatchTypeOf<
      PublicServerTypes.TestingServer.WithTmpDir.Options
    >();
    // @ts-expect-error The module entry must not forward its scoped implementation Io.
    expectTypeOf<PublicEntryTypes.TestingServer.WithTmpDir.Io[]>([]);
    // @ts-expect-error The module entry must not forward its scoped execution bookkeeping.
    expectTypeOf<PublicEntryTypes.TestingServer.WithTmpDir.Execution<number>[]>([]);
    // @ts-expect-error The published server entry must keep filesystem injection internal.
    expectTypeOf<PublicServerTypes.TestingServer.WithTmpDir.Io[]>([]);
    // @ts-expect-error The published server entry must keep execution bookkeeping internal.
    expectTypeOf<PublicServerTypes.TestingServer.WithTmpDir.Execution<number>[]>([]);
  });
});
