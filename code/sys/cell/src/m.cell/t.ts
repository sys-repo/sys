import type { t } from './common.ts';

/**
 * Cell descriptor loading and runtime service composition.
 */
export declare namespace Cell {
  /** Root library surface exported as `Cell`. */
  export type Lib = {
    readonly Schema: Schema.Lib;
    load(root: t.StringDir, options?: LoadOptions): Promise<Instance>;
  };

  /** Cell-local identifier used for views and runtime services. */
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

  /** Parsed `-config/@sys.cell/cell.yaml` descriptor. */
  export type Descriptor = {
    kind: 'cell';
    version: 1;
    dsl: Dsl;
    views?: Record<Id, View.Descriptor>;
    runtime?: Runtime.Descriptor;
  };

  /** Stored-meaning lane. */
  export type Dsl = { root: Path };

  /** Named Cell views and their materialization source. */
  export namespace View {
    /** Materialization source for a view. */
    export type Source = Source.Pull | Source.Local;

    /** Named view descriptor. */
    export type Descriptor = { source: Source };

    export namespace Source {
      /** View materialized by a pull config. */
      export type Pull = { pull: Path };

      /** View already local under the Cell root. */
      export type Local = { local: Path };
    }
  }

  /** Runtime services declared by the Cell descriptor. */
  export namespace Runtime {
    /** Runtime section of the Cell descriptor. */
    export type Descriptor = { services: Service[] };

    /** Runtime service resolved through `from` + `export` and service-owned `config`. */
    export type Service = {
      name: Id;
      kind: Id;
      for?: Service.For;
      from: string;
      export: string;
      config: Path;
    };

    export namespace Service {
      /** Declared Cell resources this service is for. */
      export type For = { views: Id[] };
    }
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
