import type { t } from '../common.ts';

/**
 * Pure dependency policy algebra.
 */
export namespace EsmPolicy {
  /** Runtime policy helper surface. */
  export type Lib = {
    /** Build the canonical candidate set for one dependency. */
    candidates(input: Input): Selection;
    /** Apply policy to one dependency and return the decision. */
    decide(input: Input): Decision;
    /** Apply policy across many dependencies. */
    decideAll(inputs: readonly Input[]): Result;
  };

  /** Supported dependency policy modes. */
  export type Mode = 'none' | 'patch' | 'minor' | 'latest';

  /** A canonical dependency selection policy. */
  export type Def = {
    readonly mode: Mode;
    readonly exclude?: readonly string[];
  };

  /** Canonical dependency subject evaluated by policy. */
  export type Subject = {
    /** Canonical manifest entry for the dependency. */
    readonly entry: t.EsmDeps.Entry;
    /** Currently pinned version in the workspace. */
    readonly current: t.StringSemver;
    /** Available versions reported by a registry adapter. */
    readonly available: readonly t.StringSemver[];
  };

  /** Complete input to one policy evaluation. */
  export type Input = {
    /** Policy definition being applied. */
    readonly policy: Def;
    /** Dependency subject under evaluation. */
    readonly subject: Subject;
  };

  /** One candidate version considered by the policy algebra. */
  export type Candidate = {
    /** Candidate version being evaluated. */
    readonly version: t.StringSemver;
    /** True when the candidate is the current pinned version. */
    readonly current?: true;
    /** True when the candidate is the latest known version. */
    readonly latest?: true;
  };

  /** Candidate set and selected outcome for one dependency. */
  export type Selection = {
    /** Current pinned version expressed as a candidate. */
    readonly current: Candidate;
    /** Candidate versions available for evaluation. */
    readonly available: readonly Candidate[];
    /** Selected candidate when policy allows an upgrade. */
    readonly selected?: Candidate;
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
    readonly code: BlockedCode;
    readonly message?: string;
  };

  /** A blocked policy decision. */
  export type Blocked = {
    readonly ok: false;
    readonly input: Input;
    readonly selection: Selection;
    readonly reason: BlockedReason;
  };

  /** A successful policy decision. */
  export type Allowed = {
    readonly ok: true;
    readonly input: Input;
    readonly selection: Selection;
  };

  /** Result of applying policy to a dependency version choice. */
  export type Decision = Allowed | Blocked;

  /** Result set from applying policy across multiple dependencies. */
  export type Result = {
    readonly decisions: readonly Decision[];
  };
}
