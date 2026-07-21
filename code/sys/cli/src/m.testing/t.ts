import type { t } from '../common.ts';

/**
 * Test helper types for CLI-facing modules.
 */
export declare namespace FakeSpinner {
  export type Lib = {
    /** Create a fake spinner instance for tests. */
    create(text?: string): Instance;
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
