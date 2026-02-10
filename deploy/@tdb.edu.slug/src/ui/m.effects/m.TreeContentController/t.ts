import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * TreeContentController.
 * Owns content-loading lifecycle derived from tree selection.
 */
export type TreeContentController = t.EffectController<
  TreeContentController.State,
  TreeContentController.Patch,
  TreeContentController.Props
> & {
  intent(next: TreeContentController.Input): void;
  view(): TreeContentController.View;
};

export declare namespace TreeContentController {
  /** Factory surface. */
  export type Lib = {
    create(props?: CreateProps): TreeContentController;
  };

  /** Factory args: choose local initial or injected ref. */
  export type CreateProps =
    | { readonly initial?: Partial<State>; readonly ref?: never }
    | { readonly ref: t.ImmutableRef<State>; readonly initial?: never };

  /** Static controller config. */
  export type Props = {
    readonly initial?: Partial<State>;
    readonly ref?: t.ImmutableRef<State>;
  };

  /** State change patch. */
  export type Patch = Partial<State>;

  /** Controller input events. */
  export type Input =
    | { readonly type: 'reset' }
    | { readonly type: 'selection.changed'; readonly key?: string }
    | { readonly type: 'load.start'; readonly request: Request }
    | { readonly type: 'load.cancel'; readonly requestId: string }
    | { readonly type: 'load.succeed'; readonly request: Request; readonly data: Content }
    | { readonly type: 'load.fail'; readonly request: Request; readonly message: string };

  export type Phase = 'idle' | 'loading' | 'ready' | 'error';

  /** Request token used to gate stale async responses. */
  export type Request = {
    readonly id: string;
    readonly key: string;
  };

  /** Controller-owned content lifecycle state. */
  export type State = {
    readonly phase: Phase;
    readonly key?: string;
    readonly request?: Request;
    readonly data?: Content;
    readonly error?: { readonly message: string };
  };

  /** UI projection for adapter/render layers. */
  export type View = {
    readonly phase: Phase;
    readonly loading: boolean;
    readonly key?: string;
    readonly data?: Content;
    readonly error?: { readonly message: string };
  };

  /** Generic content payload driven by loader adapters. */
  export type Content = Readonly<O>;
}
