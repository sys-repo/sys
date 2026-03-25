import type { t } from './common.ts';

/**
 * Tools for managing Deno Deploy application resources.
 * An application is the named deployable unit in Deno Deploy.
 */
export declare namespace DenoApp {
  export type Lib = {
    /** Create a new Deno Deploy application resource. */
    create(request: Create.Request): Promise<Create.Result>;
  };

  export namespace Create {
    /** Request to create a Deno Deploy application resource. */
    export type Request = {
      /** Deno Deploy application name. */
      readonly app: string;

      /** Optional Deno Deploy organization name. */
      readonly org?: string;

      /** Optional auth token for headless app creation. */
      readonly token?: string;

      /** Optional explicit local root path to create from. */
      readonly root?: t.StringDir;

      /** Validate and simulate creation without creating the app. */
      readonly dryRun?: boolean;

      /** Optional logging controls for the native create process boundary. */
      readonly log?: boolean | Log;
    };

    /**
     * Optional logging controls for app creation.
     */
    export type Log = {
      /** Stream native process output directly when true. */
      readonly process?: boolean;
    };

    /**
     * Outcome of an app creation attempt.
     */
    export type Result =
      /** App creation completed successfully. */
      | ({ readonly ok: true } & NativeResult)
      /** App creation failed with a native process result. */
      | ({ readonly ok: false } & NativeResult)
      /** App creation failed before a process result was produced. */
      | { readonly ok: false; readonly error: unknown };

    type NativeResult = {
      readonly code: number;
      readonly stdout: string;
      readonly stderr: string;
    };
  }
}
