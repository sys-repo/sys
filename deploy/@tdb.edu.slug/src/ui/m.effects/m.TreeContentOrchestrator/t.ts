import type { t } from './common.ts';

/**
 * TreeContentOrchestrator.
 * Bridges selection changes into content load lifecycle intents.
 */
export type TreeContentOrchestrator = {
  readonly disposed: boolean;
  dispose(): void;
};

export declare namespace TreeContentOrchestrator {
  /** Factory surface. */
  export type Lib = {
    create(props: Props): TreeContentOrchestrator;
  };

  /** Loader adapter used by the orchestrator. */
  export type Load = (args: {
    readonly request: t.TreeContentController.Request;
    readonly selection: t.TreeSelectionController.State;
  }) => Promise<t.TreeContentController.Content>;

  /** Static orchestrator configuration. */
  export type Props = {
    readonly selection: t.TreeSelectionController;
    readonly content: t.TreeContentController;
    readonly load: Load;
    readonly requestId?: () => string;
  };
}
