import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * CRDT graph utility contracts.
 */
export declare namespace CrdtGraph {
  /** Thin facade over the generic immutable graph walker for CRDT documents. */
  export type Lib = {
    /** Graph walker entrypoint for CRDT documents. */
    readonly walk: Walk.Fn;

    /** CRDT DAG utilities. */
    readonly Dag: {
      build: Dag.Fn;
      index: t.Graph.Dag.Index;
      forEach: t.Graph.Dag.ForEachSync;
      forEachAsync: t.Graph.Dag.ForEachAsync;
    };

    /** Default helpers. */
    readonly default: {
      readonly discoverRefs: t.Graph.DiscoverRefs;
    };
  };

  /** Loader used when the walker is not bound directly to a repo. */
  export type LoadDoc<T extends O = O> = t.Graph.LoadDoc<T>;

  /**
   * CRDT graph walking contracts.
   */
  export namespace Walk {
    /** Common options for walking a CRDT reference DAG. */
    export type ArgsBase<T extends O = O> = t.Graph.WalkArgsBase<T>;

    /** Repo-backed walk args. */
    export type ArgsRepo<T extends O = O> = ArgsBase<T> & {
      readonly repo: t.Crdt.Repo;
    };

    /** Loader-backed walk args. */
    export type ArgsLoad<T extends O = O> = ArgsBase<T> & {
      readonly load: LoadDoc<T>;
    };

    /** Configuration for walking a CRDT reference DAG. */
    export type Args<T extends O = O> = ArgsRepo<T> | ArgsLoad<T>;

    /** Graph walker entrypoint for CRDT documents. */
    export type Fn = <T extends O = O>(args: Args<T>) => Promise<t.Graph.WalkResult>;
  }

  /**
   * CRDT DAG materialization contracts.
   */
  export namespace Dag {
    /** Base options for building a CRDT DAG. */
    export type ArgsBase<T extends O = O> = {
      readonly id: t.StringId;
      readonly depth?: number;
      readonly processed?: t.StringId[];
      readonly discoverRefs?: t.Graph.DiscoverRefs;
      readonly includeSkipped?: boolean;
    };

    /** Repo-backed DAG args. */
    export type ArgsRepo<T extends O = O> = ArgsBase<T> & {
      readonly repo: t.Crdt.Repo;
    };

    /** Loader-backed DAG args. */
    export type ArgsLoad<T extends O = O> = ArgsBase<T> & {
      readonly load: LoadDoc<T>;
    };

    /** Arguments for building a CRDT DAG. */
    export type Args<T extends O = O> = ArgsRepo<T> | ArgsLoad<T>;

    /** CRDT DAG builder. */
    export type Fn = <T extends O = O>(args: Args<T>) => Promise<t.Graph.Dag.Result<T>>;
  }
}
