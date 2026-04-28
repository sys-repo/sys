import type { t } from './common.ts';

/**
 * Cell descriptor loading and runtime service composition.
 */
export declare namespace Cell {
  export type Lib = {
    readonly Schema: Schema.Lib;
  };

  export type Id = t.StringId;
  export type Path = t.StringPath;

  export type Descriptor = {
    kind: 'cell';
    version: 1;
    dsl: Dsl;
    views?: Record<Id, View.Descriptor>;
    runtime?: Runtime.Descriptor;
  };

  export type Dsl = { root: Path };

  export namespace View {
    export type Source = Source.Pull | Source.Local;
    export type Descriptor = { source: Source };
    export namespace Source {
      export type Pull = { pull: Path };
      export type Local = { local: Path };
    }
  }

  export namespace Runtime {
    export type Descriptor = { services: Service[] };
    export type Service = {
      name: Id;
      kind: Id;
      for?: Service.For;
      from: string;
      export: string;
      config: Path;
    };

    export namespace Service {
      export type For = { views: Id[] };
    }
  }

  export namespace Schema {
    export type Lib = {
      readonly Descriptor: Descriptor;
    };

    export type Descriptor = {
      readonly idPattern: string;
      readonly schema: t.TSchema;
      validate(value: unknown): Validation;
    };

    export type Validation = {
      readonly ok: boolean;
      readonly errors: readonly Issue[];
    };

    export type Issue = {
      readonly kind: 'schema' | 'semantic';
      readonly path: string;
      readonly message: string;
    };
  }
}
