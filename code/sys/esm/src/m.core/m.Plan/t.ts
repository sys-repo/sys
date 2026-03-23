import type { t } from '../common.ts';
import type { EsmPolicy } from '../m.Policy/t.ts';

/**
 * Pure topological dependency upgrade planning.
 */
export namespace EsmPlan {
  /** Runtime planning helper surface. */
  export type Lib = {
    /** Compute a deterministic topological upgrade plan. */
    build(input: Input): Result;
  };

  /** Canonical topological node for one dependency decision. */
  export type Node = {
    /** Canonical dependency policy decision being planned. */
    decision: EsmPolicy.Decision;
    /** Stable node key derived from the dependency identity. */
    key: string;
  };

  /** Directed dependency edge for topological planning. */
  export type Edge = {
    /** Node key that must be ordered first. */
    from: Node['key'];
    /** Node key that depends on `from`. */
    to: Node['key'];
  };

  /** Complete input to one topological planning pass. */
  export type Input = {
    /** Nodes under consideration for ordered planning. */
    nodes: readonly Node[];
    /** Directed dependency edges between the nodes. */
    edges: readonly Edge[];
  };

  /** One ordered node in the resulting upgrade plan. */
  export type Item = {
    /** Planned node. */
    node: Node;
    /** Zero-based execution order in the plan. */
    index: number;
    /** Direct dependencies that must run before this item. */
    after: readonly Node['key'][];
  };

  /** Structured cycle result when planning cannot be linearized. */
  export type Cycle = {
    /** Node keys participating in the detected cycle. */
    keys: readonly Node['key'][];
  };

  /** Canonical invalid-input code. */
  export type InvalidCode = 'node:duplicate-key' | 'edge:unknown-node';

  /** Structured invalid-input result. */
  export type Invalid = {
    ok: false;
    invalid: {
      code: InvalidCode;
      keys: readonly Node['key'][];
    };
  };

  /** Successful ordered planning result. */
  export type Ordered = {
    ok: true;
    items: readonly Item[];
  };

  /** Failed planning result due to cyclic dependency edges. */
  export type Cyclic = {
    ok: false;
    cycle: Cycle;
  };

  /** Result of topological planning over dependency decisions. */
  export type Result = Ordered | Cyclic | Invalid;
}
