import type { t } from '../../common.ts';

/**
 * Testing helpers for working on a known server (eg. HTTP/network and file-system).
 */
export declare namespace TestingServer {
  /**
   * Server testing helpers, including the canonical standard-library surface.
   * Operations use strict function-property variance, not method bivariance: replacements must
   * accept the full input contract. This intentionally tightens source compatibility.
   */
  export type Lib = t.Testing.Server.Lib & {
    /** Create or reuse a caller-owned directory; use withTmpDir for callback-scoped cleanup. */
    dir: Dir;
    /** Run a callback in a fresh temporary directory and await cleanup before settlement. */
    withTmpDir: WithTmpDir;
    /** Probe TCP connectivity, close the socket, and return status and address details. */
    connect: Connect;
  };

  /** Create or reuse a caller-owned directory. */
  export type Dir = (dirname: t.StringDir, options?: Dir.Options) => Promise<Dir.Result>;

  /**
   * Pass a fresh canonical temporary-directory path to a sync/async callback (prefix: "sys.testing.").
   * Does not change cwd. Await cleanup before settlement, including after canonicalization failure.
   * Single failures are rethrown unchanged; dual failures form a StdError aggregate with normalized
   * diagnostics ordered execution then cleanup. Cleanup is attempted, not guaranteed; callers own
   * any other resources they open.
   */
  export type WithTmpDir = <T>(
    fn: (dir: t.StringAbsoluteDir) => T,
    options?: WithTmpDir.Options,
  ) => Promise<Awaited<T>>;

  /** Probe TCP connectivity to a host (default: "127.0.0.1") and close the socket. */
  export type Connect = (
    port: t.PortNumber,
    options?: Connect.Options,
  ) => Promise<Connect.Result>;

  /**
   * Caller-owned directory contracts.
   */
  export namespace Dir {
    /** Options passed to the `Testing.dir` method. */
    export type Options = {
      /** Flag indicating if the directory should be made "unique" with a generated slug. */
      slug?: boolean;
      /** Directory location policy for test files. */
      location?: 'os-temp' | 'local-temp';
    };

    /** A sample directory to test operations on the file-system. */
    export type Result = {
      /** The path to the test directory. */
      readonly dir: t.StringAbsoluteDir;
      /** Checks if the root directory, or a sub-path within it, exists. */
      exists(...path: t.StringPath[]): Promise<boolean>;
      /** Joins a path to the root test directory. */
      join(...parts: t.StringPath[]): t.StringAbsolutePath;
      /** List file paths within the root, relative when trimRoot is true. */
      ls(trimRoot?: boolean): Promise<t.StringPath[]>;
    };
  }

  /**
   * Callback-scoped temporary-directory contracts.
   */
  export namespace WithTmpDir {
    /** Options passed to the `Testing.withTmpDir` method. */
    export type Options = {
      /** Temporary-directory prefix (default: "sys.testing."). */
      prefix?: string;
    };
  }

  /**
   * TCP connectivity probe contracts.
   */
  export namespace Connect {
    /** Options passed to the `Testing.connect` method. */
    export type Options = {
      /** Host to probe (default: "127.0.0.1"). */
      hostname?: string;
    };

    /** Response from networking `Testing.connect` method call. */
    export type Result = Readonly<{
      /** General success flag, `true` if not refused and no error. */
      ok: boolean;
      /** `false` when the TCP handshake succeeded. */
      refused: boolean;
      /** Milliseconds between calling `connect` and success/failure. */
      elapsed: t.Msecs;
      /** Socket address details. */
      address: {
        /** Remote socket address (present only when the handshake succeeded). */
        remote?: Deno.NetAddr;
        /** Local socket address (present only when the handshake succeeded). */
        local?: Deno.NetAddr;
      };
      /** Standard-shaped error object when the handshake failed. */
      error?: t.StdError;
    }>;
  }
}

/**
 * Name-compatibility projections for published consumers and generated templates.
 * These aliases share the canonical contracts' stricter variance; they do not preserve historical
 * method bivariance or guarantee full source compatibility.
 * Removal boundary: a separate breaking-surface migration after downstream consumers and templates
 * use the canonical TestingServer contracts.
 */
/** @deprecated Use TestingServer.Lib. */
export type TestingServerLib = TestingServer.Lib;
/** @deprecated Use TestingServer.Dir.Options. */
export type TestingDirOptions = TestingServer.Dir.Options;
/** @deprecated Use TestingServer.Dir.Result. */
export type TestingDir = TestingServer.Dir.Result;
/** @deprecated Use TestingServer.Connect.Result. */
export type TestConnectionResponse = TestingServer.Connect.Result;
