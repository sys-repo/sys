import type { t } from './common.ts';

/**
 * Testing helpers for working on a known server (eg. HTTP/network and file-system).
 */
export type TestingServerLib = t.TestingHttpLib & {
  /**
   * Generates a new test directory on the file-system.
   */
  dir(dirname: string, options?: t.TestingDirOptions): t.TestingDir;

  /**
   * Connects to a hostname (default is "127.0.0.1") and port on a named
   * transport (default is "tcp") and attempts to resolve to the connection.
   */
  connect(port: t.PortNumber, options?: { hostname?: string }): Promise<TestConnectionResponse>;
};

/** Options passed to the `Testing.dir` method. */
export type TestingDirOptions = {
  /** Flag indicating if the directory should be made "unique" with a generated slug. */
  slug?: boolean;
};

/**
 * A sample directory to test operations on the file-system.
 */
export type TestingDir = {
  /** The path to the test directory. */
  readonly dir: t.StringAbsoluteDir;

  /** Ensures the test directory exists. */
  create(): Promise<TestingDir>;

  /** Checks if the root directory, or a sub-path within it, exists. */
  exists(...path: t.StringPath[]): Promise<boolean>;

  /** Joins a path to the root test directory. */
  join(...parts: t.StringPath[]): t.StringAbsolutePath;

  /** Lists all paths within the root directory. */
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
