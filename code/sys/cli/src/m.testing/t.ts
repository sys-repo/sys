import type { t } from '../common.ts';

/**
 * Test helper types for CLI-facing modules.
 */
export declare namespace FakeSpinner {
  export type Lib = {
    /** Create a fake spinner instance for tests. */
    create(text?: string): Instance;
    /** Replace the process-local canonical spinner factory until the returned stub is disposed. */
    stub(args?: StubArgs): Stub;
  };

  /** Mutable input for one scoped canonical spinner-factory stub. */
  export type StubArgs = {
    spinner?: Instance;
  };

  /** One canonical spinner-factory invocation captured by a stub. */
  export type StubCall = {
    readonly text: string | undefined;
    readonly options: Readonly<t.CliSpinner.Create.Options> | undefined;
  };

  /** Disposable process-local canonical spinner-factory replacement. */
  export type Stub = {
    /** Deterministic fake returned by every captured factory call. */
    readonly spinner: Instance;
    /** Factory calls retained in invocation order. */
    readonly calls: readonly StubCall[];
    /** Restore the exact canonical spinner-factory property descriptor. */
    [Symbol.dispose](): void;
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
