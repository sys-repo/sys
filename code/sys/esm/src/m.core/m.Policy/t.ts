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

  /** A blocked policy decision. */
  export type Blocked = {
    ok: false;
    reason: string;
  };

  /** A successful policy decision. */
  export type Allowed = {
    ok: true;
    version: t.StringSemver;
  };

  /** Result of applying policy to a dependency version choice. */
  export type Decision = Allowed | Blocked;
}
