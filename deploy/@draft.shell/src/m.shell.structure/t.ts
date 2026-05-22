import type { Parse as TParse } from './m.Parse/t.ts';
import type { Resolve as TResolve } from './m.Resolve/t.ts';
import type { Schema as TSchema } from './m.Schema/t.ts';

/** Authored shell composition document. */
export declare namespace ShellStructure {
  export type Lib = {
    readonly Schema: ShellStructure.Schema.Lib;
    parse: ShellStructure.Parse.Fn;
    resolve: ShellStructure.Resolve.Fn;
  };

  /** Minimal authored document shape. */
  export type Document = {
    readonly kind: 'shell.structure';
    readonly version: 1;
  };

  /** TypeBox/schema surface for authored Shell.Structure documents. */
  export namespace Schema {
    export type Lib = TSchema.Lib;
  }

  /** Parse raw input into a Shell.Structure document. */
  export namespace Parse {
    export type Input = TParse.Input;
    export type Fn = TParse.Fn<Document>;
  }

  /** Resolve/default a parsed Shell.Structure document. */
  export namespace Resolve {
    export type Fn = TResolve.Fn<Document>;
  }
}
