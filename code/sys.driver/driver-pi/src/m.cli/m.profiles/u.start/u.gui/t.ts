import type { t } from '../common.ts';

/**
 * Profile startup contracts.
 */
export declare namespace Start {
  /**
   * Direct GUI session contracts.
   */
  export namespace Gui {
    /** Ordinary terminal outcome of one fully settled GUI session. */
    export type Outcome = 'back' | 'quit' | 'external-cancellation' | 'failed';

    /** Canonical release-session input. Release authority is fixed by Driver Pi policy. */
    export type Input = {
      /** Trusted launcher working-directory identity. */
      readonly cwd: t.PiCli.Cwd;
      /** Optional trusted cancellation for the complete session. */
      readonly until?: AbortSignal;
    };

    /** Admitted immutable authority for either supported source path. */
    export type Authority = Release.Authority | Development.Authority;

    /** Admitted ordinary GUI startup failure. */
    export type Failure = Readonly<{
      category: Failure.Category;
      evidence: Failure.Evidence;
      error: Error;
    }>;

    /** Owner boundaries injected into direct GUI session composition. */
    export type Dependencies = Readonly<{
      /** Resolve the canonical runtime store root. */
      runtimeRoot: (cwd: t.PiCli.Cwd, context?: string) => t.StringDir;
      /** Acquire BootstrapStatus ownership. */
      startStatus: (
        input: t.BootstrapStatus.StartOptions<Presentation.BootstrapPageKey>,
      ) => Promise<t.BootstrapStatus.Started>;
      /** Open one verified release Generation. */
      openGeneration: t.Dist.Generation.Open.Method;
      /** Start one independently verified application host with the authority used here. */
      startApplication: (
        input: t.DistServer.Start.Args,
      ) => Promise<Application.Owner>;
      /** Admit known application-host startup errors. */
      isHostError: t.DistServer.Error.Lib['is'];
      /** Open the capability-bearing BootstrapStatus URL. */
      openBrowser: t.OpenLib['invokeDetached'];
      /** Prepare and acquire finite presentation ownership. */
      presentation: Presentation.Lib;
    }>;

    /**
     * Canonical manifest authority.
     */
    export namespace Manifest {
      /** Canonical manifest URL and its admitted origin. */
      export type Source = Readonly<{
        href: t.StringUrl;
        origin: t.StringUrl;
      }>;
    }

    /**
     * Canonical release authority.
     */
    export namespace Release {
      /** Released-artifact evidence copied into canonical launcher policy. */
      export type Evidence = Readonly<{
        kind: 'release';
        manifestUrl: t.StringUrl;
        integrity: t.StringHash;
        expectedPkg: Readonly<t.Pkg>;
      }>;

      /** Immutable authority admitted for the canonical release path. */
      export type Authority = Readonly<{
        kind: 'release';
        source: Manifest.Source;
        integrity: t.StringHash;
        expectedPkg: Readonly<t.Pkg>;
      }>;
    }

    /**
     * Package-internal development authority.
     */
    export namespace Development {
      /** Completed-build evidence accepted only by the package-internal preview entry. */
      export type Evidence = Readonly<{
        kind: 'development';
        dir: t.StringAbsoluteDir;
        integrity: t.StringHash;
        expectedPkg: Readonly<t.Pkg>;
      }>;

      /** Package-internal preview input over one completed development build. */
      export type Input = Start.Gui.Input & {
        /** One completed package-pinned development build. */
        readonly source: Evidence;
      };

      /** Immutable authority admitted for one completed development build. */
      export type Authority = Readonly<{
        kind: 'development';
        dir: t.StringAbsoluteDir;
        integrity: t.StringHash;
        expectedPkg: Readonly<t.Pkg>;
      }>;
    }

    /**
     * Admitted source authority.
     */
    export namespace Authority {
      /** Result of copying and admitting source authority before owner acquisition. */
      export type Snapshot =
        | Readonly<{ ok: true; authority: Start.Gui.Authority }>
        | Readonly<{ ok: false; failure: Start.Gui.Failure }>;
    }

    /**
     * Canonical release recovery guidance.
     */
    export namespace Recovery {
      /** Package-owned recovery copy available only for canonical release evidence. */
      export type Policy = Readonly<{
        kind: 'local-evidence-binding';
        manifestChecksumMismatch: string;
      }>;
    }

    /**
     * Product-facing failure contracts.
     */
    export namespace Failure {
      /** Finite product-facing GUI startup failure category. */
      export type Category =
        | 'configuration-invalid'
        | 'source-unavailable'
        | 'artifact-refused'
        | 'repair-required'
        | 'local-failure'
        | 'cancelled';

      /** Owner operation associated with a local infrastructure failure. */
      export type Operation =
        | 'authority'
        | 'release-owner'
        | 'application-host'
        | 'application-listener'
        | 'status-listener';

      /** Bounded evidence retained from a failed release materialization. */
      export type MaterializationEvidence = Readonly<{
        kind: 'materialization';
        stage: t.Dist.FailureStage;
        reason: t.Dist.FailureReason;
        cleanup: t.Dist.Cleanup;
        publication?: t.Dist.FailedPublication;
        manifestChecksum?: t.Dist.ManifestChecksumMismatch;
      }>;

      /** Finite safe evidence admitted for product-facing failure presentation. */
      export type Evidence =
        | Readonly<{
          kind: 'configuration';
          reason: 'manifest-url' | 'integrity' | 'development-directory' | 'package-identity';
        }>
        | Readonly<{ kind: 'identity' }>
        | MaterializationEvidence
        | Readonly<{
          kind: 'application-host';
          reason: t.DistServer.StartFailureReason;
        }>
        | Readonly<{ kind: 'local'; operation: Operation }>
        | Readonly<{ kind: 'cancellation' }>;
    }

    /**
     * Configuration admission.
     */
    export namespace Configuration {
      /** Admitted configuration-refusal reason. */
      export type Reason = Extract<Failure.Evidence, { kind: 'configuration' }>['reason'];

      /** Result of admitting one untrusted configuration value. */
      export type Snapshot<T> =
        | Readonly<{ ok: true; value: T }>
        | Readonly<{ ok: false; reason: Reason }>;
    }

    /**
     * Generation-store policy.
     */
    export namespace Store {
      /** Immutable relative store authority selected by Driver Pi. */
      export type Policy = Readonly<{
        root: t.StringRelativePath;
        target: t.StringRelativePath;
      }>;
    }

    /**
     * Direct session composition.
     */
    export namespace Composition {
      /** Complete internal input after source authority snapshotting. */
      export type Input = Readonly<{
        cwd: t.PiCli.Cwd;
        until?: AbortSignal;
        authority: Authority.Snapshot;
        recovery?: Recovery.Policy;
      }>;

      /**
       * Events observed by phased composition.
       */
      export namespace Event {
        /** One owner-producing operation settlement. */
        export type Operation<T> =
          | Readonly<{ kind: 'operation'; value: T }>
          | Readonly<{ kind: 'operation-error'; cause: unknown }>;

        /** One selected user or launcher control. */
        export type Control = Readonly<{ kind: 'control'; outcome: Start.Gui.Outcome }>;

        /** BootstrapStatus listener settlement. */
        export type Status = Readonly<{
          kind: 'status-finished';
          rejected: boolean;
          cause?: unknown;
        }>;

        /** Autonomous presentation loss. */
        export type Presentation = Readonly<{ kind: 'presentation-lost'; cause: unknown }>;

        /** Application listener settlement. */
        export type Application = Readonly<{
          kind: 'application-finished';
          rejected: boolean;
          cause?: unknown;
        }>;

        /** Runtime event admitted by active composition phases. */
        export type Runtime = Control | Status | Presentation | Application;
      }
    }

    /**
     * Application-host ownership.
     */
    export namespace Application {
      /** Application-host authority consumed by direct GUI composition. */
      export type Owner = Pick<
        t.DistServer.Started,
        'close' | 'finished' | 'origin' | 'verification'
      >;
    }

    /**
     * Finite browser and terminal presentation.
     */
    export namespace Presentation {
      /** Runtime surface for finite GUI presentation. */
      export type Lib = Readonly<{
        /** Prepare status projection and deferred presentation acquisition. */
        prepare(
          input: Input,
          overrides?: Partial<Dependencies>,
        ): Prepared;
        /** Render one finite presentation snapshot without acquiring owners. */
        toString(input: RenderInput): string;
      }>;

      /** Complete immutable projection input for one terminal frame. */
      export type RenderInput = {
        /** Service identity. */
        readonly service: string;
        /** Capability-bearing bootstrap URL. */
        readonly url: t.StringUrl;
        /** Optional admitted development-root link. */
        readonly root?: RootLink;
        /** Optional canonical release manifest link. */
        readonly manifestUrl?: t.StringUrl;
        /** Optional package-owned recovery guidance. */
        readonly recovery?: Recovery.Policy;
        /** Current finite presentation state. */
        readonly state: State;
        /** Whether keyboard ownership is active. */
        readonly keyboard: boolean;
        /** Whether automatic browser opening failed. */
        readonly openWarning: boolean;
        /** Admitted terminal dimensions. */
        readonly viewport: t.Cli.Screen.Size;
      };

      /** Admitted development root and its exact file-link authority. */
      export type RootLink = Readonly<{
        /** Exact absolute root text shown in the terminal. */
        readonly text: t.StringAbsoluteDir;
        /** Equivalent immutable file URL. */
        readonly href: t.StringUrl;
      }>;

      /** Finite screen state owned by one GUI presentation. */
      export type State =
        | Readonly<{ kind: 'preparing' }>
        | Readonly<{ kind: 'starting-app-host' }>
        | Readonly<{
          kind: 'ready';
          origin: t.StringUrl;
          digest: t.StringHash;
          directoryHref?: t.StringUrl;
        }>
        | Readonly<{
          kind: 'failed';
          category: Failure.Category;
          safeEvidence: Failure.Evidence;
        }>
        | Readonly<{ kind: 'stopping' }>;

      /** Resize observation and disposal authority acquired by presentation. */
      export type ResizeEvents = Readonly<{
        readonly resize$: Readonly<{
          subscribe(
            listener: (event: t.Cli.Screen.SizeChanged) => void,
          ): Readonly<{ unsubscribe(): void }>;
        }>;
        dispose(): void;
      }>;

      /** Terminal dependencies used to acquire presentation ownership. */
      export type Dependencies = Readonly<{
        /** Whether the current terminal can support interactive ownership. */
        isInteractive: () => boolean;
        /** Read the current viewport candidate. */
        size: () => unknown;
        /** Acquire the resize stream and its direct disposal authority. */
        events: () => ResizeEvents;
        /** Replace the current terminal frame. */
        repaint: (frame: string) => void;
        /** Acquire exclusive keyboard ownership. */
        bindKeyboard: t.Cli.Keyboard.Lib['bind'];
        /** Settle and release keyboard ownership. */
        shutdownKeyboard: t.Cli.Keyboard.Lib['shutdown'];
      }>;

      /** Callbacks and admitted authority projected by one presentation. */
      export type Input = Readonly<{
        /** Optional source authority displayed by terminal and bootstrap pages. */
        authority?: Start.Gui.Authority;
        /** Optional package-owned recovery guidance. */
        recovery?: Recovery.Policy;
        /** Request return to the profile menu. */
        onBack: () => void;
        /** Request GUI session shutdown. */
        onQuit: () => void;
        /** Dismiss a fully presented failure. */
        onDismiss: () => void;
      }>;

      /** Acquired finite presentation lifecycle. */
      export type Owner = Readonly<{
        /** Rejects if an owned presentation resource terminates autonomously. */
        readonly lost: Promise<never>;
        /** Current immutable projection state. */
        readonly current: State;
        /** Project application-host startup. */
        starting(): void;
        /** Project the independently admitted application host. */
        ready(input: {
          origin: t.StringUrl;
          digest: t.StringHash;
          dir: t.StringAbsoluteDir;
        }): void;
        /** Project one admitted ordinary failure. */
        failed(failure: Start.Gui.Failure): void;
        /** Project a nonfatal browser-open warning. */
        warnOpen(): void;
        /** Repaint from the current state. */
        redraw(): void;
        /** Stop and settle every presentation resource. */
        shutdown(): Promise<void>;
      }>;

      /**
       * Bootstrap page copy.
       */
      export namespace Page {
        /** Static copy used to generate one BootstrapStatus page. */
        export type Copy = Readonly<{
          title: string;
          message: string;
          heading?: string;
          refresh?: 'reload';
        }>;
      }

      /**
       * Service-row projection.
       */
      export namespace Service {
        /** One semantic value rendered in the service region. */
        export type Value =
          | { readonly kind: 'title' | 'warning'; readonly text: string }
          | { readonly kind: 'checksum'; readonly text: t.StringHash }
          | { readonly kind: 'evidence'; readonly items: readonly string[] }
          | {
            readonly kind: 'manifest';
            readonly hash: t.StringHash;
            readonly directoryHref?: t.StringUrl;
            readonly href?: t.StringUrl;
          }
          | { readonly kind: 'capability'; readonly text: t.StringUrl }
          | { readonly kind: 'path'; readonly root: RootLink }
          | { readonly kind: 'state'; readonly state: State }
          | { readonly kind: 'url'; readonly text: t.StringUrl };

        /** Service value rendered on exactly one row. */
        export type SingleLineValue = Exclude<Value, { readonly kind: 'evidence' }>;

        /** Label and semantic value for one service fact. */
        export type Fact = readonly [label: string, value: Value];
      }

      /** Bootstrap page variants owned by the finite presentation. */
      export type BootstrapPageKey =
        | 'preparing'
        | 'starting-app-host'
        | 'failed-configuration-invalid'
        | 'failed-source-unavailable'
        | 'failed-artifact-refused'
        | 'failed-repair-required'
        | 'failed-local-failure'
        | 'failed-cancelled'
        | 'stopping';

      /** Immutable bootstrap projection and deferred terminal-owner acquisition. */
      export type Prepared = Readonly<{
        /** Status pages passed directly to BootstrapStatus. */
        status: t.BootstrapStatus.StartOptions<BootstrapPageKey>;
        /** Acquire terminal ownership after BootstrapStatus exposes its URL. */
        acquire(url: t.StringUrl): Promise<Owner>;
      }>;
    }
  }
}
