import type { t } from './common.ts';
import { browserOrigin, rp } from '../../u/u.issuer.ts';
import { registrationAdvisory } from '../../u/u.registrationAdvisory.ts';

const signedOut: t.Passkey.Snapshot = {
  authentication: { kind: 'signed-out' },
  operation: { kind: 'idle' },
  context: {
    origin: browserOrigin,
    rpId: rp.id,
    rpName: rp.name,
    webAuthn: { kind: 'available' },
    verifier: { kind: 'available' },
  },
};
const account = { principal: 'principal-example-01', label: 'Example account' } as const;
const signedIn: t.Passkey.Snapshot = {
  ...signedOut,
  authentication: { kind: 'signed-in', ...account, credentialCount: 2 },
};

/** Deliberately simulated observations, not browser probes or successful callback outcomes. */
export const Fixtures: readonly t.PasskeyFixture[] = [
  { id: 'signed-out', label: 'Signed out', snapshot: signedOut },
  { id: 'signed-in', label: 'Signed in', snapshot: signedIn },
  {
    id: 'registration-hint',
    label: 'Signed out • registration hint',
    snapshot: { ...signedOut, context: { ...signedOut.context, registrationAdvisory } },
  },
  {
    id: 'checking',
    label: 'Checking session',
    snapshot: { ...signedOut, authentication: { kind: 'checking' } },
  },
  {
    id: 'unknown-session',
    label: 'Session lookup failed',
    snapshot: {
      ...signedOut,
      authentication: { kind: 'unknown', summary: 'Session lookup did not complete' },
    },
  },
  {
    id: 'unknown-keys',
    label: 'Unknown credential count',
    snapshot: {
      ...signedIn,
      authentication: { kind: 'signed-in', ...account },
    },
  },
  {
    id: 'preparing',
    label: 'Preparing registration',
    snapshot: {
      ...signedOut,
      operation: { kind: 'pending', action: 'create-account', phase: 'Preparing request' },
    },
  },
  {
    id: 'authenticator',
    label: 'Waiting for authenticator',
    snapshot: {
      ...signedOut,
      operation: { kind: 'pending', action: 'sign-in', phase: 'Waiting for authenticator' },
    },
  },
  {
    id: 'verifying',
    label: 'Verification pending',
    snapshot: {
      ...signedOut,
      operation: { kind: 'pending', action: 'sign-in', phase: 'Verifying response' },
    },
  },
  {
    id: 'signing-out',
    label: 'Signing out',
    snapshot: {
      ...signedIn,
      operation: { kind: 'pending', action: 'sign-out', phase: 'Ending session' },
    },
  },
  {
    id: 'unavailable',
    label: 'Verifier unavailable',
    snapshot: {
      ...signedOut,
      context: {
        ...signedOut.context,
        verifier: { kind: 'unavailable', reason: 'Verifier not configured' },
      },
    },
  },
  {
    id: 'browser-unavailable',
    label: 'Browser unavailable • sign-out allowed',
    snapshot: {
      ...signedIn,
      context: {
        ...signedIn.context,
        webAuthn: { kind: 'unavailable', reason: 'WebAuthn is unavailable in this context' },
      },
    },
  },
  {
    id: 'registration-success',
    label: 'Registration success • still signed out',
    snapshot: {
      ...signedOut,
      result: {
        kind: 'success',
        action: 'create-account',
        summary: 'Credential registered (fixture)',
      },
    },
  },
  {
    id: 'failed-add',
    label: 'Add failed • session preserved',
    snapshot: {
      ...signedIn,
      result: { kind: 'failure', action: 'add-passkey', summary: 'Request did not complete' },
    },
  },
  {
    id: 'long-content',
    label: 'Long identifiers • long error message',
    snapshot: {
      ...signedIn,
      authentication: {
        kind: 'signed-in',
        label: account.label,
        principal: 'principal-example-0123456789'.repeat(5),
        credentialCount: 2,
      },
      context: {
        ...signedIn.context,
        origin: `https://${'example-'.repeat(8)}service.test:1234`,
        rpId: `${'example-'.repeat(8)}service.test`,
        webAuthn: {
          kind: 'unavailable',
          reason: 'Browser prerequisite unavailable: '.repeat(4),
        },
      },
      result: {
        kind: 'failure',
        action: 'add-passkey',
        summary: 'The request did not complete; no more specific cause is known. '.repeat(4),
      },
    },
  },
];
