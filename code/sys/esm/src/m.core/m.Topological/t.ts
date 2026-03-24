import type { t } from '../common.ts';
import type { EsmPolicy } from '../m.Policy/t.ts';

/**
 * Pure deterministic topological ordering.
 */
export namespace EsmTopological {
  /** Runtime planning helper surface. */
  export type Lib = {
    /** Compute a deterministic topological ordering. */
    build<T>(input: Input<T>): Result<T>;
  };

  /** Canonical node in one topological ordering pass. */
  export type Node<T> = {
    /** Stable node key within the ordering input. */
    readonly key: string;
    /** Opaque payload carried through the ordering result. */
    readonly value: T;
  };

  /** Directed precedence edge for topological ordering. */
  export type Edge = {
    /** Node key that must be ordered first. */
    readonly from: string;
    /** Node key that depends on `from`. */
    readonly to: string;
  };

  /** Complete input to one topological ordering pass. */
  export type Input<T> = {
    /** Nodes under consideration for ordering. */
    readonly nodes: readonly Node<T>[];
    /** Directed precedence edges between the nodes. */
    readonly edges: readonly Edge[];
  };

  /** One ordered node in the resulting topological order. */
  export type Item<T> = {
    /** Ordered node. */
    readonly node: Node<T>;
    /** Zero-based position in the order. */
    readonly index: number;
    /** Direct dependencies that must run before this item. */
    readonly after: readonly Node<T>['key'][];
  };

  /** Structured cycle result when ordering cannot be linearized. */
  export type Cycle = {
    /** Node keys participating in the detected cycle. */
    readonly keys: readonly string[];
  };

  /** Canonical invalid-input code. */
  export type InvalidCode = 'node:duplicate-key' | 'edge:unknown-node';

  /** Structured invalid-input result. */
  export type Invalid = {
    readonly ok: false;
    readonly invalid: {
      readonly code: InvalidCode;
      /** Keys involved in the invalid input. */
      readonly keys: readonly string[];
    };
  };

  /** Successful topological ordering result. */
  export type Ordered<T> = {
    readonly ok: true;
    readonly items: readonly Item<T>[];
  };

  /** Failed ordering result due to cyclic dependency edges. */
  export type Cyclic = {
    readonly ok: false;
    readonly cycle: Cycle;
  };

  /** Result of topological ordering over one payload type. */
  export type Result<T> = Ordered<T> | Cyclic | Invalid;

  /** ESM-specialized node payload. */
  export type DecisionNode = Node<EsmPolicy.Decision>;
  /** ESM-specialized topological input. */
  export type DecisionInput = Input<EsmPolicy.Decision>;
  /** ESM-specialized ordered item. */
  export type DecisionItem = Item<EsmPolicy.Decision>;
  /** ESM-specialized topological result. */
  export type DecisionResult = Result<EsmPolicy.Decision>;
}
