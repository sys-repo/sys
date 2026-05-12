import type { t } from './common.ts';

/**
 * Cell descriptor loading and runtime service composition.
 */
export declare namespace Cell {
  /** Root library surface exported as `Cell`. */
  export type Lib = {
    readonly Schema: Schema.Lib;
    readonly Runtime: Runtime.Lib;
    readonly Action: Action.Lib;
    load(root: t.StringDir, options?: LoadOptions): Promise<Instance>;
  };

  /** Cell-local identifier used for runtime services. */
  export type Id = t.StringId;

  /** Path declared in `cell.yaml`, resolved relative to the Cell root. */
  export type Path = t.StringPath;

  /** Options for loading a Cell folder. */
  export type LoadOptions = {};

  /** Loaded Cell folder context. */
  export type Instance = {
    readonly root: t.StringDir;
    readonly paths: { readonly descriptor: t.StringPath };
    readonly descriptor: Descriptor;
  };

  /** Parsed `-config/@sys.cell/cell.yaml` boot/composition descriptor. */
  export type Descriptor = {
    kind: 'cell';
    version: 1;
    runtime?: Runtime.Descriptor;
    actions?: Action.Descriptor[];
  };

  /** Finite operator workflows declared by the Cell descriptor. */
  export namespace Action {
    /** Action verification/execution API. */
    export type Lib = {
      verify(cell: Instance, options?: VerifyOptions): Promise<Verification>;
      run(cell: Instance, name: Id, options?: RunOptions): Promise<RunResult>;
    };

    /** Action verification options. */
    export type VerifyOptions = {
      /** Trusted import specifier prefixes. Defaults to `['@sys/']`. */
      readonly trusted?: readonly string[];
    };

    /** Action run options. */
    export type RunOptions = VerifyOptions & {
      /** Optional operator hook for final leaf action args after owner config loading. */
      runArgs?(input: RunArgsInput): RunArgs | Promise<RunArgs>;
    };

    /** Root action entry. Every root action is runnable by name. */
    export type Descriptor = Leaf | Composite;

    /** Trusted finite endpoint action. */
    export type Leaf = {
      name: Id;
      from: string;
      export: string;
      config?: Path;
    };

    /** Composite action that sequences other root actions by reference. */
    export type Composite = {
      name: Id;
      steps: Step[];
    };

    /** Ref-only composite step. */
    export type Step = {
      action: Id;
    };

    /** Action verification result. */
    export type Verification = {
      readonly actions: readonly VerifiedAction[];
    };

    /** Verified root action. */
    export type VerifiedAction = VerifiedLeaf | VerifiedComposite;

    /** Verified executable leaf action. */
    export type VerifiedLeaf = {
      readonly kind: 'leaf';
      readonly action: Leaf;
      readonly paths: { readonly config?: t.StringPath };
      readonly config?: Record<string, unknown>;
      readonly endpoint: Endpoint;
    };

    /** Verified composite action. */
    export type VerifiedComposite = {
      readonly kind: 'composite';
      readonly action: Composite;
    };

    /** Finite action endpoint. */
    export type Endpoint<Result = unknown> = {
      run(args: RunArgs): Result | Promise<Result>;
    };

    /** Structured arguments passed to a leaf action endpoint. */
    export type RunArgs = {
      readonly cwd: t.StringDir;
      readonly config?: Record<string, unknown>;
      readonly paths: { readonly config?: t.StringPath };
    };

    /** Action run argument hook input. */
    export type RunArgsInput = {
      readonly cell: Instance;
      readonly root: Descriptor;
      readonly action: VerifiedLeaf;
      readonly base: RunArgs;
    };

    /** Action run result. */
    export type RunResult = {
      readonly action: Descriptor;
      readonly steps: readonly StepResult[];
    };

    /** Leaf action execution result. */
    export type StepResult = {
      readonly action: Leaf;
      readonly ok: boolean;
      readonly result?: unknown;
      readonly error?: unknown;
      readonly metrics: RunMetrics;
    };

    /** Cell-measured finite action metrics. */
    export type RunMetrics = {
      readonly run: {
        /** Instant immediately before endpoint args are finalized and `run(args)` is called. */
        readonly startedAt: t.UnixTimestamp;
        /** Instant immediately after `run(args)` returns, resolves, or fails. */
        readonly resolvedAt: t.UnixTimestamp;
      };
    };
  }

  /** Runtime services declared by the Cell descriptor. */
  export namespace Runtime {
    /** Runtime verification/activation API. */
    export type Lib = {
      verify(cell: Instance, options?: VerifyOptions): Promise<Verification>;
      start(cell: Instance, options?: StartOptions): Promise<Started>;
      /** Wait for started service lifecycle handles that expose `finished`. */
      wait(runtime: Started): Promise<void>;
    };

    /** Runtime verification options. */
    export type VerifyOptions = {
      /** Trusted import specifier prefixes. Defaults to `['@sys/']`. */
      readonly trusted?: readonly string[];
    };

    /** Runtime start options. */
    export type StartOptions = VerifyOptions & {
      /** Optional operator hook for final service start arguments after owner config loading. */
      startArgs?(input: StartArgsInput): StartArgs | Promise<StartArgs>;
    };

    /** Runtime service start arguments. */
    export type StartArgs = Record<string, unknown>;

    /** Service start argument hook input. */
    export type StartArgsInput = {
      readonly cell: Instance;
      readonly service: VerifiedService;
      /** Base arguments derived from Cell root and service-owned config. */
      readonly base: StartArgs;
    };

    /** Runtime topology verification result. */
    export type Verification<Handle = unknown> = {
      readonly services: readonly VerifiedService<Handle>[];
    };

    /** Started runtime services. */
    export type Started<Handle = unknown> = {
      readonly services: readonly StartedService<Handle>[];
      close(reason?: unknown): Promise<void>;
    };

    /** Verified runtime service with resolved config and lifecycle endpoint. */
    export type VerifiedService<Handle = unknown> = {
      readonly service: Service;
      readonly paths: { readonly config: t.StringPath };
      readonly config: Record<string, unknown>;
      readonly endpoint: LifecycleEndpoint<Handle>;
    };

    /** Started runtime service with its opaque owner handle and Cell-measured metrics. */
    export type StartedService<Handle = unknown> = VerifiedService<Handle> & {
      /** Opaque owner handle returned by `LifecycleEndpoint.start(args)`. */
      readonly handle: Handle;
      readonly metrics: ServiceMetrics;
    };

    /** Runtime service metrics measured by Cell-owned composition. */
    export type ServiceMetrics = {
      readonly start: {
        /** Instant immediately before `LifecycleEndpoint.start(args)` is called. */
        readonly startedAt: t.UnixTimestamp;
        /** Instant immediately after `LifecycleEndpoint.start(args)` returns or resolves. */
        readonly resolvedAt: t.UnixTimestamp;
      };
    };

    /** Runtime service lifecycle endpoint. */
    export type LifecycleEndpoint<Handle = unknown> = {
      start(args: StartArgs): Handle | Promise<Handle>;
    };

    /** Runtime section of the Cell descriptor. */
    export type Descriptor = { services: Service[] };

    /** Runtime service resolved through `from` + `export` and service-owned `config`. */
    export type Service = {
      name: Id;
      from: string;
      export: string;
      config: Path;
    };
  }

  /** Schema/validation surface. */
  export namespace Schema {
    /** Schema library exposed on `Cell.Schema`. */
    export type Lib = {
      readonly Descriptor: Descriptor;
    };

    /** Validator and runtime schema for `Cell.Descriptor`. */
    export type Descriptor = {
      readonly idPattern: string;
      readonly schema: t.TSchema;
      validate(value: unknown): Validation;
    };

    /** Validation result for schema and semantic checks. */
    export type Validation = {
      readonly ok: boolean;
      readonly errors: readonly Issue[];
    };

    /** Descriptor validation issue. */
    export type Issue = {
      readonly kind: 'schema' | 'semantic';
      readonly path: string;
      readonly message: string;
    };
  }
}
