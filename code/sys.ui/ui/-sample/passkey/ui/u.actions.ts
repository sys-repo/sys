import { Is, type t } from './common.ts';

type Action = {
  readonly id: t.Passkey.Action;
  readonly key: string;
  readonly label: string;
  readonly reason?: string;
  readonly onClick?: () => void;
};

/** Project only actions appropriate to the supplied session; never execute or serialize work. */
export function actionsOf(props: t.Passkey.Props): readonly Action[] {
  const { authentication } = props.snapshot;
  switch (authentication.kind) {
    case 'signed-out':
      return [
        action('create-account', 'New account', props.onCreateAccount),
        action('sign-in', 'Existing account', props.onSignIn),
      ];
    case 'signed-in':
      return [
        action('add-passkey', 'Passkeys', props.onAddPasskey),
        action('sign-out', 'Session', props.onSignOut),
      ];
    default:
      return [];
  }

  function action(id: t.Passkey.Action, key: string, onClick?: () => void): Action {
    const reason = disabledReason(props.snapshot, id, onClick);
    return { id, key, label: actionLabel(id), reason, onClick: reason ? undefined : onClick };
  }
}

export function actionLabel(action: t.Passkey.Action): string {
  switch (action) {
    case 'create-account':
      return 'Create with Passkey';
    case 'sign-in':
      return 'Sign In';
    case 'add-passkey':
      return 'Add Passkey';
    case 'sign-out':
      return 'Sign Out';
  }
}

/** Sign-out needs a supplied session callback, not browser ceremony prerequisites. */
function disabledReason(
  snapshot: t.Passkey.Snapshot,
  action: t.Passkey.Action,
  callback?: () => void,
) {
  if (snapshot.operation.kind === 'pending') return 'Operation in progress';
  if (!callback) return 'Action not connected';
  if (action === 'sign-out') return;
  const { origin, rpId, webAuthn, verifier } = snapshot.context;
  if (!origin || Is.blank(origin)) return 'Origin not supplied';
  if (!rpId || Is.blank(rpId)) return 'RP ID not configured';
  if (webAuthn.kind !== 'available') return webAuthn.reason || 'WebAuthn readiness unknown';
  if (verifier.kind !== 'available') return verifier.reason || 'Verifier readiness unknown';
}
