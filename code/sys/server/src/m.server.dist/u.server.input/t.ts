import type { t } from '../common.server.ts';

export type * from '../../common/t.ts';

type Rejection = { readonly ok: false; readonly reason: DistServerInput.FailureReason };

type StartFields = {
  readonly dir: t.StringDir;
  readonly limits: Readonly<t.FsPkg.Dist.Verify.Limits>;
  readonly hostname: t.StringHostname;
  readonly port: t.PortNumber;
  readonly browserPolicy?: t.DistServer.BrowserPolicy.Input;
  readonly name?: string;
  readonly silent?: boolean;
  readonly keyboard?: t.HttpServer.Start.Options['keyboard'];
  readonly until?: t.UntilInput;
};

/**
 * Internal contracts for Dist-server input admission.
 */
export declare namespace DistServerInput {
  /** Sanitized direct-input admission failure. */
  export type FailureReason = 'invalid-input' | 'invalid-hostname';

  /** Exact data-property snapshot admitted from an input object. */
  export type Record = { readonly [key: string]: unknown };

  /**
   * Start-input admission contracts.
   */
  export namespace Start {
    /** Admitted content-pinned start authority. */
    export type Snapshot = StartFields & { readonly pin: t.DistPin };
    /** Admitted locally verified start authority. */
    export type LocalSnapshot = StartFields;
    /** Content-pinned start-input settlement. */
    export type Preparation =
      | { readonly ok: true; readonly value: Snapshot }
      | Rejection;
    /** Locally verified start-input settlement. */
    export type LocalPreparation =
      | { readonly ok: true; readonly value: LocalSnapshot }
      | Rejection;
    /** Shared start-input settlement used before authority-mode projection. */
    export type SharedPreparation =
      | { readonly ok: true; readonly value: StartFields }
      | Rejection;
  }

  /**
   * Serve-input admission contracts.
   */
  export namespace Serve {
    /** Normalized terminal-navigation mode. */
    export type Navigation = 'default' | 'nested';
    /** Admitted content-pinned serve authority. */
    export type Snapshot = {
      readonly start: Start.Snapshot;
      readonly displayDir: t.StringDir;
      readonly pkgSubpath?: string;
      readonly navigation: Navigation;
    };
    /** Admitted locally verified serve authority. */
    export type LocalSnapshot = {
      readonly start: Start.LocalSnapshot;
      readonly displayDir: t.StringDir;
      readonly pkgSubpath?: string;
      readonly navigation: Navigation;
    };
    /** Content-pinned serve-input settlement. */
    export type Preparation =
      | { readonly ok: true; readonly value: Snapshot }
      | Rejection;
    /** Locally verified serve-input settlement. */
    export type LocalPreparation =
      | { readonly ok: true; readonly value: LocalSnapshot }
      | Rejection;
  }
}
