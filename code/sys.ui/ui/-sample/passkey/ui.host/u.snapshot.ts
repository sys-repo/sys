import { Str } from '../common.ts';
import type { t } from '../ui/common.ts';
import { browserOrigin, rp } from '../u/u.issuer.ts';

type State = t.AccountRuntime.Snapshot;
const phases = {
  begin: 'Preparing request',
  ceremony: 'Waiting for authenticator',
  finish: 'Checking response',
  request: 'Sending request',
} as const;

const registrationAdvisory = Str.dedent(`
  **Use a sample passkey**${'  '}
  Restarting the cell’s \`sys.ui:accounts\` service clears its in-memory accounts, registrations,
  and sessions. Your [authenticator](https://www.w3.org/TR/webauthn-3/#authenticator) may still
  offer the [passkey](https://www.w3.org/TR/webauthn-3/#passkey), but it will no longer work here.
`);

/** Session facts and the outcome of an attempt are independent observations. */
export function snapshotOf(state: State): t.Passkey.Snapshot {
  const operation = operationOf(state.operation);
  return {
    authentication: authenticationOf(state.session, operation),
    operation,
    result: state.last && resultOf(state.last),
    context: {
      origin: browserOrigin,
      rpId: rp.id,
      rpName: rp.name,
      registrationAdvisory,
      verifier: { kind: 'configured' },
      webAuthn: browserOf(state.browser),
    },
  };
}

function authenticationOf(
  session: State['session'],
  operation: t.Passkey.Operation,
): t.Passkey.Authentication {
  if (session.kind === 'signed-in') {
    const { principal, label, credentialCount } = session.value.account;
    return { kind: 'signed-in', principal, label, credentialCount };
  }
  if (session.kind === 'signed-out') return { kind: 'signed-out' };
  if (operation.kind === 'checking') return { kind: 'checking' };
  return { kind: 'unknown', summary: 'Reload this page, then choose Sign In.' };
}

function operationOf(op: State['operation']): t.Passkey.Operation {
  if (op.kind !== 'pending') return op;
  if (op.action === 'inspect') return { kind: 'checking' };
  return { kind: 'pending', action: op.action, phase: phases[op.phase] };
}

function browserOf(browser: State['browser']): t.Passkey.Availability {
  if (browser.kind === 'unchecked') return { kind: 'unknown', reason: 'Not checked' };
  if (browser.kind === 'available') return browser;
  const reason = browser.reason === 'insecure-context'
    ? 'A secure browser context is required'
    : 'This browser lacks the required passkey APIs';
  return { kind: 'unavailable', reason };
}

function resultOf({ action, outcome }: NonNullable<State['last']>): t.Passkey.Result {
  switch (outcome.kind) {
    case 'accepted':
      return { action, kind: 'success', summary: 'Accepted by the account service.' };
    case 'rejected':
      return { action, kind: 'failure', summary: `Service refused: ${outcome.code}.` };
    case 'indeterminate':
      return { action, kind: outcome.kind, summary: 'The service may have completed this action.' };
    case 'not-submitted':
      return {
        action,
        kind: outcome.kind,
        reason: outcome.reason,
        summary: `No account change was submitted (${outcome.reason}).`,
      };
  }
}
