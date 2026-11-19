import { Accounts } from '../../m.Accounts/mod.ts';
import type { t } from './common.ts';

/** Internal result admission is fallible preparation, never post-commit delivery. */
export function validate(name: t.Accounts.Name, result: unknown) {
  if (!Accounts.readResult(name, result)) throw failure();
}

export function accepted<V>(value: V) {
  return { kind: 'accepted', value } as const;
}

export function rejected<C extends string>(code: C) {
  return { kind: 'rejected', code } as const;
}

export function failure() {
  const error = new Error('Account service failed.');
  error.stack = undefined;
  return Object.freeze(error);
}
