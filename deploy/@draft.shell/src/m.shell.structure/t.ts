import type { Parse as TParse } from './m.Parse/t.ts';
import type { Resolve as TResolve } from './m.Resolve/t.ts';
import type { Schema as TSchema } from './m.Schema/t.ts';

/** Authored Shell.Structure contract. */
export declare namespace ShellStructure {
  export type Lib = {
    readonly Schema: ShellStructure.Schema.Lib;
    parse: ShellStructure.Parse.Fn;
    resolve: ShellStructure.Resolve.Fn;
  };

  /** Minimal authored shell structure root. */
  export type Structure = {
    readonly kind: 'shell.structure';
    readonly version: 1;
    readonly name?: string;
  };

  /** Canonical/defaulted shell structure root. */
  export type Resolved = Structure;

  /** TypeBox/schema surface for authored Shell.Structure values. */
  export namespace Schema {
    export type Issue = TSchema.Issue;
    export type Validation<T> = TSchema.Validation<T>;
    export type Lib = TSchema.Lib<Structure>;
  }

  /** Parse raw input into a Shell.Structure value. */
  export namespace Parse {
    export type Input = TParse.Input;
    export type Fn = TParse.Fn<Structure>;
  }

  /** Resolve/default a parsed Shell.Structure value. */
  export namespace Resolve {
    export type Fn = TResolve.Fn<Structure, Resolved>;
  }
}
