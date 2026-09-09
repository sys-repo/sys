import type { t } from './common.ts';
import type * as TBind from './t.bind.ts';
import type * as TLink from './t.link.ts';

/**
 * Tools for binding between a Monaco editor and an immutable CRDT document interface.
 */
export declare namespace EditorCrdt {
  /** Runtime library surface. */
  export type Lib = {
    readonly bind: Bind;
    readonly useBinding: UseBinding;
    readonly Link: Link.Lib;
  };

  /** Setup a Monaco/CRDT binding. */
  export type Bind = TBind.Bind;

  /** Hook for setting up and tearing down a Monaco/CRDT binding. */
  export type UseBinding = TBind.UseBinding;

  /** CRDT/editor binding contracts. */
  export namespace Binding {
    export type Instance = TBind.BindingInstance;
    export type ReadyHandler = TBind.ReadyHandler;
    export type Ready = TBind.Ready;
    export type Args = TBind.Args;
    export type Hook = TBind.Hook;
  }

  /** CRDT link helper contracts. */
  export namespace Link {
    export type Lib = TLink.Lib;
    export type Register = TLink.Register;
    export type RegisterOptions = TLink.RegisterOptions;
    export type ClickHandler = TLink.ClickHandler;
    export type Click = TLink.Click;
    export type CreateDoc = TLink.CreateDoc;
    export type CreateResult = TLink.CreateResult;
    export type Enable = TLink.Enable;
    export type EnableOptions = TLink.EnableOptions;
  }
}
