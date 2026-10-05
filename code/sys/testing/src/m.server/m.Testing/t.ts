import type { t } from './common.ts';

/**
 * Testing helpers for working on a known server (eg. HTTP/network and file-system).
 */
export type TestingServerLib = t.Testing.Server.Lib & {
  /** Create or reuse a caller-owned directory; use withTmpDir for callback-scoped cleanup. */
  dir(dirname: t.StringDir, options?: t.TestingDirOptions): Promise<t.TestingDir>;

  /**
   * Pass a fresh canonical temporary-directory path to a sync/async callback (prefix: "sys.testing.").
   * Does not change cwd. Await cleanup before settlement, including after canonicalization failure.
   * Single failures are rethrown unchanged; dual failures form a StdError aggregate with normalized
   * diagnostics ordered execution then cleanup. Cleanup is attempted, not guaranteed; callers own
   * any other resources they open.
   */
  withTmpDir<T>(
    fn: (dir: t.StringAbsoluteDir) => T,
    options?: { readonly prefix?: string },
  ): Promise<Awaited<T>>;

  /**
   * Probe TCP connectivity to a host (default: "127.0.0.1").
   * Close the socket and return status and address details.
   */
  connect(port: t.PortNumber, options?: { hostname?: string }): Promise<TestConnectionResponse>;
};

/** Options passed to the `Testing.dir` method. */
export type TestingDirOptions = {
  /** Flag indicating if the directory should be made "unique" with a generated slug. */
  slug?: boolean;
  /** Directory location policy for test files. */
  location?: 'os-temp' | 'local-temp';
};

/**
 * A sample directory to test operations on the file-system.
 */
export type TestingDir = {
  /** The path to the test directory. */
  readonly dir: t.StringAbsoluteDir;

  /** Checks if the root directory, or a sub-path within it, exists. */
  exists(...path: t.StringPath[]): Promise<boolean>;

  /** Joins a path to the root test directory. */
  join(...parts: t.StringPath[]): t.StringAbsolutePath;

  /** List file paths within the root, relative when trimRoot is true. */
  ls(trimRoot?: boolean): Promise<t.StringPath[]>;
};

/**
 * Response from networking `Testing.connect` method call:
 */
export type TestConnectionResponse = Readonly<{
  /** General success flag, `true` if not refused and no error. */
  ok: boolean;
  /** `false` when the TCP handshake succeeded. */
  refused: boolean;
  /** Milliseconds between calling `connect` and success/failure. */
  elapsed: t.Msecs;
  /** Socket address details: */
  address: {
    /** Remote socket address (present only when the handshake succeeded). */
    remote?: Deno.NetAddr;
    /** Local socket address (present only when the handshake succeeded). */
    local?: Deno.NetAddr;
  };
  /** Standard-shaped error object when the handshake failed. */
  error?: t.StdError;
}>;
