import type { t } from '../common.ts';

/**
 * Pure dependency policy algebra.
 */
export namespace EsmPolicy {
  /** Runtime policy helper surface. */
  export type Lib = {};

  /** Supported dependency policy modes. */
  export type Mode = 'none' | 'patch' | 'minor' | 'latest';

  /** A canonical dependency selection policy. */
  export type Def = {
    mode: Mode;
    exclude?: readonly string[];
  };

  /** Canonical dependency subject evaluated by policy. */
  export type Subject = {
    /** Canonical manifest entry for the dependency. */
    entry: t.EsmDeps.Entry;
    /** Currently pinned version in the workspace. */
    current: t.StringSemver;
    /** Available versions reported by a registry adapter. */
    available: readonly t.StringSemver[];
  };

  /** Complete input to one policy evaluation. */
  export type Input = {
    /** Policy definition being applied. */
    policy: Def;
    /** Dependency subject under evaluation. */
    subject: Subject;
  };

  /** A blocked policy decision. */
  export type Blocked = {
    ok: false;
    input: Input;
    reason: string;
  };

  /** A successful policy decision. */
  export type Allowed = {
    ok: true;
    input: Input;
    version: t.StringSemver;
  };

  /** Result of applying policy to a dependency version choice. */
  export type Decision = Allowed | Blocked;

  /** Result set from applying policy across multiple dependencies. */
  export type Result = {
    decisions: readonly Decision[];
  };
}
