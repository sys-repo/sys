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

  /** One candidate version considered by the policy algebra. */
  export type Candidate = {
    /** Candidate version being evaluated. */
    version: t.StringSemver;
    /** True when the candidate is the current pinned version. */
    current?: true;
    /** True when the candidate is the latest known version. */
    latest?: true;
  };

  /** Candidate set and selected outcome for one dependency. */
  export type Selection = {
    /** Current pinned version expressed as a candidate. */
    current: Candidate;
    /** Candidate versions available for evaluation. */
    available: readonly Candidate[];
    /** Selected candidate when policy allows an upgrade. */
    selected?: Candidate;
  };

  /** Canonical blocked-reason code. */
  export type BlockedCode =
    | 'policy:none'
    | 'policy:excluded'
    | 'version:none-available'
    | 'version:not-newer'
    | 'version:not-allowed';

  /** Structured reason explaining why selection was blocked. */
  export type BlockedReason = {
    code: BlockedCode;
    message?: string;
  };

  /** A blocked policy decision. */
  export type Blocked = {
    ok: false;
    input: Input;
    selection: Selection;
    reason: BlockedReason;
  };

  /** A successful policy decision. */
  export type Allowed = {
    ok: true;
    input: Input;
    selection: Selection;
  };

  /** Result of applying policy to a dependency version choice. */
  export type Decision = Allowed | Blocked;

  /** Result set from applying policy across multiple dependencies. */
  export type Result = {
    decisions: readonly Decision[];
  };
}
