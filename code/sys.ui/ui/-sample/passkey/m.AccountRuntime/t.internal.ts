import type { t } from './common.ts';
export type * from '../common.t.ts';
export type { HttpCmd } from '@sys/http/t';
export type { Time } from '@sys/std/t';

/** A workflow may announce a phase or observe cancellation, but cannot release its slot. */
export type Pending = {
  readonly signal: AbortSignal;
  phase(value: Extract<t.AccountRuntime.Operation, { kind: 'pending' }>['phase']): boolean;
};

/** Private proposal. Only the owning lifecycle can adopt a grant or publish session facts. */
export type Completion = {
  readonly outcome: t.AccountRuntime.Outcome;
  readonly session?: t.AccountRuntime.Session;
  readonly grant?: t.Accounts.Grant;
};

export type Send = <N extends t.Accounts.Name>(
  name: N,
  input: t.Accounts.Payload[N],
  signal: AbortSignal,
  bearer?: string,
) => Promise<t.Accounts.Attempt<N>>;
