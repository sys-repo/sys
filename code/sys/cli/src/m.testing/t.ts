import type { t } from '../common.ts';

/**
 * Test helper types for CLI-facing modules.
 */
export declare namespace FakeSpinner {
  export type Lib = {
    /** Create a fake spinner instance for tests. */
    create(text?: string): Instance;
    /** Create an explicit spinner-factory dependency with captured calls. */
    adapter(args?: AdapterArgs): Adapter;
  };

  /** Mutable input for one explicit spinner-factory adapter. */
  export type AdapterArgs = {
    spinner?: Instance;
  };

  /** One spinner-factory invocation captured by an adapter. */
  export type AdapterCall = {
    readonly text: string | undefined;
    readonly options: Readonly<t.CliSpinner.Create.Options> | undefined;
  };

  /** Explicit spinner-factory dependency for injection into an owning boundary. */
  export type Adapter = {
    /** Deterministic fake returned by every captured factory call. */
    readonly spinner: Instance;
    /** Factory calls retained in invocation order. */
    readonly calls: readonly AdapterCall[];
    /** Factory dependency to inject into the code under test. */
    readonly create: t.CliSpinner.Lib['create'];
  };

  export type Status = 'idle' | 'spinning' | 'stopped' | 'succeeded' | 'failed';

  export type Instance = t.CliSpinner.Instance & {
    /** Current lifecycle status captured by the fake. */
    status: Status;
    /** Number of start calls. */
    starts: number;
    /** Number of stop calls, including stop calls caused by succeed/fail. */
    stops: number;
    /** Number of succeed calls. */
    succeeds: number;
    /** Number of fail calls. */
    fails: number;
    /** Number of render calls. Ora-compatible for injected spinner handles. */
    renders: number;
    /** Ora-compatible render hook for code that injects below the core spinner type. */
    render(): Instance;
  };
}
