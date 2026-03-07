import type { t } from './common.ts';

/**
 * TreeSelectionController.
 * Owns tree + selection invariants for TreeHost.
 */
export type TreeSelectionController = t.EffectController<
  TreeSelectionController.State,
  TreeSelectionController.Patch,
  TreeSelectionController.Props
> & {
  /** Canonical controller intent entrypoint. */
  intent(next: TreeSelectionController.Input): void;
  view(): TreeSelectionController.View;
};

export declare namespace TreeSelectionController {
  /** Factory surface. */
  export type Lib = {
    create(props?: TreeSelectionController.Props): TreeSelectionController;
  };

  /** Static config properties of the controller. */
  export type Props = {
    readonly initial?: InitialInput;
  };

  /** Initial seed input for controller creation. */
  export type InitialInput = Partial<State> | (() => Partial<State>);

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
