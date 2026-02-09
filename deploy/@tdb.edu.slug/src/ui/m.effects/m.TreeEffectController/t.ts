import type { t } from './common.ts';

/**
 * TreeEffectController - orchestration surface above TreeHost.
 * Owns tree selection + external load synchronization state.
 */
export type TreeEffectController = t.EffectController<
  TreeEffectController.State,
  TreeEffectController.Patch,
  TreeEffectController.Props
>;

export namespace TreeEffectController {
  /** Factory surface. */
  export type Lib = {
    create(props?: TreeEffectController.Props): TreeEffectController;
  };

  /** Static config properties of the controller. */
  export type Props = {
    readonly initial?: Partial<State>;
  };

  export type Patch = Partial<State>;

  /**
   * Controller input events.
   */
  export type Input =
    | { readonly type: 'reset' }
    | { readonly type: 'tree.clear' }
    | { readonly type: 'tree.set'; readonly tree: t.TreeHostViewNodeList }
    | { readonly type: 'path.request'; readonly path?: t.ObjectPath }
    | { readonly type: 'ref.request'; readonly ref?: string }
    | { readonly type: 'content.loading'; readonly ref?: string }
    | { readonly type: 'content.clear' }
    | { readonly type: 'content.set'; readonly data: Content };

  /**
   * Controller state.
   * Invariant: no tree => no selected path/ref/content.
   */
  export type State = {
    /** TreeHost view tree model. */
    readonly tree?: t.TreeHostViewNodeList;

    /** Current TreeHost selection path. */
    readonly selectedPath?: t.ObjectPath;
    /** Selection identity projected from tree/ref sync. */
    readonly selectedRef?: string;

    /** Current main-content payload (loader-owned domain data). */
    readonly content?: Content;

    /** Loading flags for external orchestration. */
    readonly loading?: Loading;

    /** Terminal error, if any. */
    readonly error?: { readonly message: string };
  };

  /**
   * UI projection for adapters.
   */
  export type View = {
    readonly treeHost: Pick<t.TreeHostProps, 'tree' | 'selectedPath'>;
    readonly selection: {
      readonly path?: t.ObjectPath;
      readonly ref?: string;
    };
    readonly loading: Loading;
    readonly content?: Content;
  };

  export type Loading = {
    readonly tree?: boolean;
    readonly content?: boolean;
  };

  /**
   * Controller payload that can drive the `main` slot.
   * Kept intentionally generic; concrete adapters can narrow this.
   */
  export type Content = Readonly<Record<string, unknown>>;
}
