import type { t } from '../common.ts';

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
    create(props?: Props): TreeContentController;
  };

  /** Static controller config. */
  export type Props = {
    readonly initial?: Partial<State>;
  };

  export type Patch = Partial<State>;

  /** Controller input events. */
  export type Input =
    | { readonly type: 'reset' }
    | { readonly type: 'origin.set'; readonly origin?: t.StringUrl }
    | {
      readonly type: 'selection.set';
      readonly path?: t.ObjectPath;
      readonly ref?: string;
      readonly isLeaf?: boolean;
    }
    | { readonly type: 'load.start'; readonly key: string }
    | { readonly type: 'load.success'; readonly key: string; readonly data: Content }
    | { readonly type: 'load.error'; readonly key: string; readonly message: string }
    | { readonly type: 'load.clear' };

  /** Controller state. */
  export type State = {
    readonly origin?: t.StringUrl;
    readonly contentKey?: string;
    readonly loadedKey?: string;
    readonly contentLoading?: boolean;
    readonly contentData?: Content;
    readonly contentError?: { readonly message: string };
  };

  /** UI projection for adapters. */
  export type View = {
    readonly loading: boolean;
    readonly key?: string;
    readonly data?: Content;
    readonly error?: { readonly message: string };
  };

  /** Generic content payload driven by loader adapters. */
  export type Content = Readonly<O>;
}
