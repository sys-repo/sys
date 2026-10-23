/**
 * User-agent contracts.
 */
export declare namespace UserAgent {
  /** User-agent helper library surface. */
  export type Lib = {
    /** Reduced semantic data for the current user-agent. */
    readonly current: Info;
  };

  /**
   * Reduced semantic user-agent data consumed by the app.
   *
   * Ref:
   *    https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
   */
  export type Info = {
    readonly os: OS;
    readonly is: Flags;
  };

  /** Boolean flags derived from a user-agent string. */
  export type Flags = {
    readonly apple: boolean;
    readonly macOS: boolean;
    readonly iOS: boolean;
    readonly iPad: boolean;
    readonly iPhone: boolean;
    readonly chromium: boolean;
    readonly firefox: boolean;
  };

  /** Details about the user-agent operating system. */
  export type OS = {
    readonly name: string;
  };
}
