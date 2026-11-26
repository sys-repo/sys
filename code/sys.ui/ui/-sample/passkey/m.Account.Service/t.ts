import type { t } from './common.ts';

/**
 * In-memory account authority. Restart or disposal forgets its records,
 * but does not remove credentials stored on authenticators.
 */
export declare namespace AccountService {
  export type Lib = {
    /** Construct one private authority with fixed, explicitly bounded policy. */
    create(options: Options): Instance;
  };

  /** Request-local handlers share only this instance's private authoritative records. */
  export type Instance = t.Disposable & {
    readonly handlers: t.Accounts.Service;
  };

  /** Required host policy; construction snapshots it before any operation can run. */
  export type Options = {
    rp: { id: string; name: string };
    origins: string[];
    algorithms: COSEAlgorithmIdentifier[];
    lifetimes: t.Accounts.Lifetimes;
    capacity: Capacity;
  };

  /** Global record limits; admission never evicts live authority to make space. */
  export type Capacity = {
    accounts: number;
    credentials: number;
    transactions: number;
    sessions: number;
  };
}
