import type { t } from '../common.ts';

/**
 * Browser assertion and fixed Service Worker lifecycle observation contracts.
 */
export declare namespace Browser {
  /**
   * Product-neutral browser assertion and lifecycle observation surface.
   */
  export type Lib = {
    /** Load one URL in an isolated local browser and report runtime errors. */
    load(url: string, options?: Load.Options): Promise<Load.Result>;
    /** Fixed Service Worker lifecycle observation surface. */
    readonly ServiceWorker: ServiceWorker.Lib;
  };

  /** Browser backend used for browser assertions. */
  export type Kind = 'Chrome';

  /**
   * Single-navigation browser assertion contracts.
   */
  export namespace Load {
    export type Options = {
      /** Browser backend. Defaults to Chrome. */
      browser?: Kind;
      /** Browser executable path. Defaults to CHROME_BIN or common platform locations. */
      executablePath?: t.StringAbsolutePath;
      /** Milliseconds to wait after the correlated main-frame load lifecycle. */
      waitAfterLoad?: t.Msecs;
      /** Predicate for known benign browser errors. */
      allowError?: (text: string) => boolean;
    };

    export type Result = {
      readonly ok: boolean;
      readonly url: string;
      readonly browser: Kind;
      readonly executablePath: t.StringAbsolutePath;
      readonly errors: readonly string[];
      readonly stderr: string;
    };
  }

  /**
   * Isolated Service Worker lifecycle observation contracts.
   */
  export namespace ServiceWorker {
    /** Service Worker actions exposed by Browser. */
    export type Lib = {
      /** Run ordered fixed browser actions in one fresh Chrome profile and target session. */
      readonly scenario: (options: Scenario.Options) => Promise<Scenario.Result>;
    };

    /**
     * Scenario input and result contracts.
     */
    export namespace Scenario {
      /** Ordered actions and bounded observation settings. */
      export type Options = {
        /** Ordered closed-vocabulary actions. The first navigation fixes the origin. */
        steps: readonly Step[];
        /** Browser executable path. Defaults to CHROME_BIN or common platform locations. */
        executablePath?: t.StringAbsolutePath;
        /** Default action/load timeout. */
        timeout?: t.Msecs;
        /** Delay before each settled action snapshot. */
        settle?: t.Msecs;
        /** Observe polling interval. */
        pollInterval?: t.Msecs;
        /** Maximum retained diagnostic entries. */
        maxDiagnostics?: number;
        /** Maximum retained characters per diagnostic. */
        maxDiagnosticLength?: number;
      };

      /** Frozen evidence from one isolated browser run. */
      export type Result = {
        /**
         * True only when all steps complete, every expectation matches, each update selects exactly
         * one registration, required APIs and complete snapshot evidence are available, and no
         * retained or omitted error occurs.
         */
        readonly ok: boolean;
        readonly browser: Kind;
        readonly origin: t.StringUrl;
        readonly steps: readonly Step.Result[];
        readonly diagnostics: Diagnostics;
        /** Browser observations describe only this controlled run, never prior external profiles. */
        readonly attestation: 'controlled-run-only';
      };
    }

    /** Ordered browser action union. */
    export type Step = Step.Navigate | Step.Reload | Step.Update | Step.Observe;

    /**
     * Ordered browser actions and their evidence.
     */
    export namespace Step {
      /** Navigate the target to an absolute HTTP(S) URL. */
      export type Navigate = { kind: 'navigate'; url: t.StringUrl };
      /** Reload the current target. */
      export type Reload = { kind: 'reload' };
      /** Request one Service Worker update for a scope on the fixed origin. */
      export type Update = { kind: 'update'; scope: t.StringUrl };
      /** Poll one fixed expectation until it matches or times out. */
      export type Observe = {
        kind: 'observe';
        expect: Expectation;
        timeout?: t.Msecs;
        interval?: t.Msecs;
      };

      /** Frozen evidence for one requested action. */
      export type Result = {
        readonly index: number;
        readonly action: Step;
        readonly outcome: Outcome;
        readonly observation: Observation;
        readonly diagnostics: Diagnostics;
      };

      /** Completion evidence for one action. */
      export type Outcome =
        | { readonly kind: 'completed' }
        | {
          readonly kind: 'update';
          readonly scope: t.StringUrl;
          readonly matches: number;
          readonly requested: boolean;
          readonly error?: string;
        }
        | { readonly kind: 'observed'; readonly matched: boolean; readonly attempts: number };
    }

    /** Fixed observation assertion union. */
    export type Expectation =
      | Expectation.Registrations
      | Expectation.Controller
      | Expectation.Cache
      | Expectation.Registration
      | Expectation.Worker;

    /**
     * Fixed assertions over one Service Worker observation.
     */
    export namespace Expectation {
      /** Require an exact registration count. */
      export type Registrations = { kind: 'registrations'; count: number };
      /** Require no controller, or one controller with an exact script identity. */
      export type Controller =
        | { kind: 'controller'; state: 'absent' }
        | { kind: 'controller'; state: 'present'; scriptURL: t.StringUrl };
      /** Require a named cache to be present or absent. */
      export type Cache = { kind: 'cache'; name: string; state: 'present' | 'absent' };
      /** Require a registration at one scope to be present or absent. */
      export type Registration = {
        kind: 'registration';
        scope: t.StringUrl;
        state: 'present' | 'absent';
      };
      /** Require no worker in a slot, or a worker with exact state and script identity. */
      export type Worker =
        | {
          kind: 'worker';
          scope: t.StringUrl;
          slot: 'installing' | 'waiting' | 'active';
          state: 'absent';
        }
        | {
          kind: 'worker';
          scope: t.StringUrl;
          slot: 'installing' | 'waiting' | 'active';
          state: ServiceWorker.Worker.State;
          scriptURL: t.StringUrl;
        };
    }

    /** Frozen browser state observed after one action. */
    export type Observation = {
      readonly href: t.StringUrl;
      readonly origin: t.StringUrl;
      readonly available: {
        readonly serviceWorker: boolean;
        readonly cacheStorage: boolean;
      };
      readonly controller?: Worker;
      readonly registrations: readonly Registration[];
      readonly cacheNames: readonly string[];
      readonly truncated: {
        readonly registrations: boolean;
        readonly cacheNames: boolean;
        readonly strings: boolean;
      };
    };

    /** One observed Service Worker registration. */
    export type Registration = {
      readonly scope: t.StringUrl;
      readonly updateViaCache: string;
      readonly installing?: Worker;
      readonly waiting?: Worker;
      readonly active?: Worker;
    };

    /** One observed Service Worker. */
    export type Worker = {
      readonly scriptURL: t.StringUrl;
      readonly state: Worker.State;
    };

    /**
     * Observed Service Worker state contracts.
     */
    export namespace Worker {
      /** Browser-reported Service Worker lifecycle state. */
      export type State =
        | 'parsed'
        | 'installing'
        | 'installed'
        | 'activating'
        | 'activated'
        | 'redundant'
        | 'unknown';
    }

    /** Retained browser diagnostics from one scenario or action. */
    export type Diagnostics = {
      readonly entries: readonly Diagnostics.Entry[];
      readonly truncated: boolean;
      readonly omitted: number;
      /** Number of omitted diagnostics known to have error severity. */
      readonly omittedErrors: number;
    };

    /**
     * Browser diagnostic contracts.
     */
    export namespace Diagnostics {
      /** One sanitized browser diagnostic. */
      export type Entry = {
        readonly source: 'console' | 'runtime' | 'log' | 'navigation';
        readonly level: 'error' | 'warning';
        readonly text: string;
        readonly truncated: boolean;
      };
    }
  }
}
