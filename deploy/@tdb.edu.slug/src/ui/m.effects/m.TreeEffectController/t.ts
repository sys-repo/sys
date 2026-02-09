import type { t } from './common.ts';

/**
 * TreeEffectController.
 * Owns tree + selection invariants for TreeHost.
 */
export type TreeEffectController = t.EffectController<
  TreeEffectController.State,
  TreeEffectController.Patch,
  TreeEffectController.Props
> & {
  /** Canonical controller intent entrypoint. */
  intent(next: TreeEffectController.Input): void;
  view(): TreeEffectController.View;
};

export declare namespace TreeEffectController {
  /** Factory surface. */
  export type Lib = {
    create(props?: TreeEffectController.Props): TreeEffectController;
  };

  /** Static config properties of the controller. */
  export type Props = {
    readonly initial?: Partial<State>;
  };

  export type Patch = Partial<State>;

  /** Controller input events. */
  export type Input =
    | { readonly type: 'reset' }
    | { readonly type: 'tree.clear' }
    | { readonly type: 'tree.set'; readonly tree: t.TreeHostViewNodeList }
    | { readonly type: 'path.request'; readonly path?: t.ObjectPath }
    | { readonly type: 'ref.request'; readonly ref?: string };

  /**
   * Controller state.
   * Invariant: no tree => no selected path/ref.
   */
  export type State = {
    /** TreeHost view tree model. */
    readonly tree?: t.TreeHostViewNodeList;

    /** Current TreeHost selection path. */
    readonly selectedPath?: t.ObjectPath;
    /** Selection identity projected from tree/ref sync. */
    readonly selectedRef?: string;
  };

  /**
   * UI projection for adapters.
   */
  export type View = {
    readonly treeHost: Pick<t.TreeHostProps, 'tree' | 'selectedPath'>;
    readonly selection: { readonly path?: t.ObjectPath; readonly ref?: string };
  };
}
