import type { t } from './common.ts';
export type * from '../common.t.ts';
export type { CredentialDeviceType, WebAuthnCredential } from '@simplewebauthn/server';

/** Private fixed policy; vendor types never enter the sample's public type pool. */
export type Policy = t.DeepReadonly<t.AccountService.CreateOptions>;
export type Purpose = 'create' | 'signIn' | 'add';
export type BeginReply = t.Accounts.Reply<
  t.Accounts.Challenge<t.Accounts.Wire.CreationOptions | t.Accounts.Wire.RequestOptions>,
  'invalid-request' | 'capacity' | 'no-session'
>;
export type RegistrationReply = t.Accounts.Reply<
  t.Accounts.Grant | t.Accounts.Session,
  t.Accounts.FinishRejection | 'credential-conflict' | 'no-session'
>;
export type Account = {
  readonly principal: string;
  readonly handle: string;
  readonly label: string;
};
export type StoredSession = { readonly account: Account; readonly expiresAt: number };
export type VerifiedCredential = {
  readonly credential: t.WebAuthnCredential;
  readonly deviceType: t.CredentialDeviceType;
  readonly backedUp: boolean;
};
export type StoredCredential = VerifiedCredential & { readonly account: Account };
export type VerifiedAssertion = {
  readonly counter: number;
  readonly deviceType: t.CredentialDeviceType;
  readonly backedUp: boolean;
};
export type Transaction = {
  readonly purpose: Purpose;
  readonly expiresAt: number;
  readonly account?: Account;
  readonly session?: StoredSession;
  readonly bearer?: string;
  challenge: string;
  used: boolean;
};
export type AuthorityState = {
  readonly accounts: Map<string, Account>;
  readonly credentials: Map<string, StoredCredential>;
  readonly sessions: Map<string, StoredSession>;
};

/** Trusted sibling-only owner; never capture current/disposed across a suspension. */
export type ServiceAuthority = {
  readonly current: AuthorityState;
  readonly disposed: boolean;
  readonly transactions: Map<string, Transaction>;
  now(): number;
  expiry(duration: number): number;
  prune(): void;
  live(bearer?: string): StoredSession | undefined;
  observe(session: StoredSession, authority?: AuthorityState): t.Accounts.Session;
  cloneState(): AuthorityState;
  grant(next: AuthorityState, account: Account): t.Accounts.Grant;
  publish(next: AuthorityState): void;
  dispose(): void;
};

/** Trusted private seams for deterministic verification-completion and time tests. */
export type Verifier = {
  registration(
    response: t.Accounts.Wire.Registration,
    challenge: string,
    policy: Policy,
  ): Promise<VerifiedCredential | undefined>;
  authentication(
    response: t.Accounts.Wire.Authentication,
    challenge: string,
    stored: StoredCredential,
    policy: Policy,
  ): Promise<VerifiedAssertion | undefined>;
};
export type ServiceDeps = { now: () => number; verifier: Verifier };
