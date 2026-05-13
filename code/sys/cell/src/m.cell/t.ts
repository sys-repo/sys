import type { t } from './common.ts';

/**
 * Cell descriptor loading, service composition, and finite task execution.
 */
export declare namespace Cell {
  /** Root library surface exported as `Cell`. */
  export type Lib = {
    readonly Schema: Schema.Lib;
    readonly Services: Services.Lib;
    readonly Task: Task.Lib;
    /** Load a Cell folder. Defaults to the current process cwd when `root` is omitted. */
    load(root?: t.StringDir, options?: LoadOptions): Promise<Instance>;
    start(cell: Instance, options?: Services.StartOptions): Promise<Services.Started>;
    task(cell: Instance, name: Id, options?: Task.RunOptions): Promise<Task.RunResult>;
  };

  /** Cell-local identifier used for services and tasks. */
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
    services?: Services.Service[];
    tasks?: Task.Descriptor[];
  };

  /** Finite operator workflows declared by the Cell descriptor. */
  export namespace Task {
    /** Task verification/execution API. */
    export type Lib = {
      verify(cell: Instance, options?: VerifyOptions): Promise<Verification>;
      run(cell: Instance, name: Id, options?: RunOptions): Promise<RunResult>;
    };

    /** Task verification options. */
    export type VerifyOptions = {
      /** Trusted import specifier prefixes. Defaults to `['@sys/']`. */
      readonly trusted?: readonly string[];
    };

    /** Task run options. */
    export type RunOptions = VerifyOptions;

    /** Root task entry. Every root task is runnable by name. */
    export type Descriptor = Leaf | Composite;

    /** Trusted finite endpoint task. */
    export type Leaf = {
      name: Id;
      from: string;
      export: string;
      config?: Path;
    };

    /** Composite task that sequences other root tasks by reference. */
    export type Composite = {
      name: Id;
      steps: Step[];
    };

    /** Ref-only composite step. */
    export type Step = {
      task: Id;
    };

    /** Task verification result. */
    export type Verification = {
      readonly tasks: readonly VerifiedTask[];
    };

    /** Verified root task. */
    export type VerifiedTask = VerifiedLeaf | VerifiedComposite;

    /** Verified executable leaf task. */
    export type VerifiedLeaf = {
      readonly kind: 'leaf';
      readonly task: Leaf;
      readonly paths: { readonly config?: t.StringPath };
      readonly endpoint: Endpoint;
    };

    /** Verified composite task. */
    export type VerifiedComposite = {
      readonly kind: 'composite';
      readonly task: Composite;
    };

    /** Finite task endpoint. */
    export type Endpoint<Result = unknown> = {
      run(args: RunArgs): Result | Promise<Result>;
    };

    /** Structured arguments passed to a leaf task endpoint. */
    export type RunArgs = {
      readonly cwd: t.StringDir;
      readonly paths: { readonly config?: t.StringPath };
    };

    /** Task run result. */
    export type RunResult = {
      readonly task: Descriptor;
      readonly steps: readonly StepResult[];
    };

    /** Leaf task execution result. */
    export type StepResult = {
      readonly task: Leaf;
      readonly ok: boolean;
      readonly result?: unknown;
      readonly error?: unknown;
      readonly metrics: RunMetrics;
    };

    /** Cell-measured finite task metrics. */
    export type RunMetrics = {
      readonly run: {
        /** Instant immediately before endpoint args are finalized and `run(args)` is called. */
        readonly startedAt: t.UnixTimestamp;
        /** Instant immediately after `run(args)` returns, resolves, or fails. */
        readonly resolvedAt: t.UnixTimestamp;
      };
    };
  }

  /** Services declared by the Cell descriptor. */
  export namespace Services {
    /** Services verification/activation API. */
    export type Lib = {
      verify(cell: Instance, options?: VerifyOptions): Promise<Verification>;
      start(cell: Instance, options?: StartOptions): Promise<Started>;
      /** Wait for started service lifecycle handles that expose `finished`. */
      wait(started: Started): Promise<void>;
    };

    /** Services verification options. */
    export type VerifyOptions = {
      /** Trusted import specifier prefixes. Defaults to `['@sys/']`. */
      readonly trusted?: readonly string[];
    };

    /** Services start options. */
    export type StartOptions = VerifyOptions;

    /** Service start arguments. */
    export type StartArgs = {
      readonly cwd: t.StringDir;
      readonly paths: { readonly config: t.StringPath };
    };

    /** Services verification result. */
    export type Verification<Handle = unknown> = {
      readonly services: readonly VerifiedService<Handle>[];
    };

    /** Started services aggregate. */
    export type Started<Handle = unknown> = {
      readonly services: readonly StartedService<Handle>[];
      close(reason?: unknown): Promise<void>;
    };

    /** Verified service with resolved config ref and lifecycle endpoint. */
    export type VerifiedService<Handle = unknown> = {
      readonly service: Service;
      readonly paths: { readonly config: t.StringPath };
      readonly endpoint: LifecycleEndpoint<Handle>;
    };

    /** Started service with its opaque owner handle and Cell-measured metrics. */
    export type StartedService<Handle = unknown> = VerifiedService<Handle> & {
      /** Opaque owner handle returned by `LifecycleEndpoint.start(args)`. */
      readonly handle: Handle;
      readonly metrics: ServiceMetrics;
    };

    /** Service metrics measured by Cell-owned composition. */
    export type ServiceMetrics = {
      readonly start: {
        /** Instant immediately before `LifecycleEndpoint.start(args)` is called. */
        readonly startedAt: t.UnixTimestamp;
        /** Instant immediately after `LifecycleEndpoint.start(args)` returns or resolves. */
        readonly resolvedAt: t.UnixTimestamp;
      };
    };

    /** Service lifecycle endpoint. */
    export type LifecycleEndpoint<Handle = unknown> = {
      start(args: StartArgs): Handle | Promise<Handle>;
    };

    /** Service resolved through `from` + `export` and service-owned `config`. */
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

    /** Validator and schema for `Cell.Descriptor`. */
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
