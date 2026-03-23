import type { t } from '../common.ts';
import type { EsmPolicy } from '../m.Policy/t.ts';

/**
 * Pure topological dependency upgrade planning.
 */
export namespace EsmTopological {
  /** Runtime planning helper surface. */
  export type Lib = {
    /** Compute a deterministic topological upgrade plan. */
    build(input: Input): Result;
  };

  /** Canonical topological node for one dependency decision. */
  export type Node = {
    /** Canonical dependency policy decision being planned. */
    readonly decision: EsmPolicy.Decision;
    /** Stable node key derived from the dependency identity. */
    readonly key: string;
  };

  /** Directed dependency edge for topological planning. */
  export type Edge = {
    /** Node key that must be ordered first. */
    readonly from: Node['key'];
    /** Node key that depends on `from`. */
    readonly to: Node['key'];
  };

  /** Complete input to one topological planning pass. */
  export type Input = {
    /** Nodes under consideration for ordered planning. */
    readonly nodes: readonly Node[];
    /** Directed dependency edges between the nodes. */
    readonly edges: readonly Edge[];
  };

  /** One ordered node in the resulting upgrade plan. */
  export type Item = {
    /** Planned node. */
    readonly node: Node;
    /** Zero-based execution order in the plan. */
    readonly index: number;
    /** Direct dependencies that must run before this item. */
    readonly after: readonly Node['key'][];
  };

  /** Structured cycle result when planning cannot be linearized. */
  export type Cycle = {
    /** Node keys participating in the detected cycle. */
    readonly keys: readonly Node['key'][];
  };

  /** Canonical invalid-input code. */
  export type InvalidCode = 'node:duplicate-key' | 'edge:unknown-node';

  /** Structured invalid-input result. */
  export type Invalid = {
    readonly ok: false;
    readonly invalid: {
      readonly code: InvalidCode;
      readonly keys: readonly Node['key'][];
    };
  };

  /** Successful ordered planning result. */
  export type Ordered = {
    readonly ok: true;
    readonly items: readonly Item[];
  };

  /** Failed planning result due to cyclic dependency edges. */
  export type Cyclic = {
    readonly ok: false;
    readonly cycle: Cycle;
  };

  /** Result of topological planning over dependency decisions. */
  export type Result = Ordered | Cyclic | Invalid;
}
