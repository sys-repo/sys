import type { t } from './common.ts';

/**
 * Composable TreeHost selection-to-content bridge adapter.
 */
export declare namespace TreeContentDriver {
  /** Public module surface. */
  export type Lib = {
    readonly createOrchestrator: (props: OrchestratorProps) => Orchestrator;
  };

  /** Async content loader for a selected tree identity. */
  export type ContentLoader = (args: {
    readonly request: t.TreeContentController.Request;
    readonly selection: t.TreeSelectionController.State;
  }) => Promise<t.TreeContentController.Content>;

  /** Controller-composition runtime. */
  export type Orchestrator = t.Lifecycle & {
    readonly selection: t.TreeSelectionController;
    readonly content: t.TreeContentController;
    intent(next: OrchestratorInput): void;
    reset(): void;
  };

  /** Creation args for the orchestration runtime. */
  export type OrchestratorProps = {
    readonly load: ContentLoader;
    readonly until?: t.UntilInput;
    readonly selection?: t.TreeSelectionController;
    readonly content?: t.TreeContentController;
    readonly onSelectedRefChange?: (ref?: string) => void;
  };

  /** External intents accepted by the composed runtime. */
  export type OrchestratorInput =
    | { readonly type: 'reset' }
    | { readonly type: 'tree.clear' }
    | { readonly type: 'tree.set'; readonly tree: t.TreeHostViewNodeList }
    | { readonly type: 'path.request'; readonly path?: t.ObjectPath }
    | { readonly type: 'ref.request'; readonly ref?: string };
}
