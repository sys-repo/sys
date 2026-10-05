import type { t } from './common.ts';
import type { TestingServer as PublicTestingServer } from './t.ts';

export type * from '../../common/t.ts';
export type { Fs } from '@sys/fs/t';

/**
 * Internal server testing contracts; public members project from their canonical owner.
 */
export declare namespace TestingServer {
  export type Lib = PublicTestingServer.Lib;
  export type Dir = PublicTestingServer.Dir;
  export type WithTmpDir = PublicTestingServer.WithTmpDir;
  export type Connect = PublicTestingServer.Connect;

  /**
   * Caller-owned directory contracts.
   */
  export namespace Dir {
    export type Options = PublicTestingServer.Dir.Options;
    export type Result = PublicTestingServer.Dir.Result;
  }

  /**
   * Callback-scoped temporary-directory implementation contracts.
   */
  export namespace WithTmpDir {
    export type Options = PublicTestingServer.WithTmpDir.Options;

    /** Stored filesystem binding for the deterministic lifetime seam. */
    export type Io = Readonly<Pick<t.Fs.Lib, 'makeTempDir' | 'realPath' | 'remove'>>;

    /** Callback/setup outcome; preserve arbitrary failures, including falsy values. */
    export type Execution<T> =
      | { readonly ok: true; readonly value: T }
      | { readonly ok: false; readonly error: unknown };
  }

  /**
   * TCP connectivity probe contracts.
   */
  export namespace Connect {
    export type Options = PublicTestingServer.Connect.Options;
    export type Result = PublicTestingServer.Connect.Result;
  }
}
