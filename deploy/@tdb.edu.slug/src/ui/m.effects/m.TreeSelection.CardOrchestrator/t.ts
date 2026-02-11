import type { t } from './common.ts';

/**
 * TreeSelectionCardOrchestrator.
 * Bridges DataCard signals to TreeSelectionController intents.
 */
export type TreeSelectionCardOrchestrator = t.Lifecycle;

export declare namespace TreeSelectionCardOrchestrator {
  /** Factory surface. */
  export type Lib = {
    create(props: Props): TreeSelectionCardOrchestrator;
  };

  export type CardSignals = {
    readonly result: {
      readonly response: t.Signal<unknown>;
    };
    readonly treeContent: {
      readonly ref: t.Signal<string | undefined>;
    };
    readonly treePlayback: {
      readonly ref: t.Signal<string | undefined>;
      readonly refs: t.Signal<string[] | undefined>;
    };
  };

  export type TreeFactory = {
    readonly fromResponse: (response: unknown) => t.TreeHostViewNodeList | undefined;
    readonly fromPlaybackRefs?: (refs?: string[]) => t.TreeHostViewNodeList | undefined;
  };

  /** Static orchestrator configuration. */
  export type Props = {
    readonly selection: t.TreeSelectionController;
    readonly card: CardSignals;
    readonly cardKind: t.Signal<t.DataCardKind | undefined>;
    readonly tree: TreeFactory;
    readonly until?: t.UntilInput;
  };
}
