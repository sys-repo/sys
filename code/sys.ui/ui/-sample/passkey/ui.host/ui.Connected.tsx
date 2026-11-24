import React from 'react';
import type { t } from '../ui/common.ts';
import { Passkey } from '../ui/mod.ts';
import type { openSample } from './u.sample.ts';
import { snapshotOf } from './u.snapshot.ts';

type Props = Pick<t.Passkey.Props, 'theme' | 'debug' | 'sections'> & {
  sample: ReturnType<typeof openSample>;
};

/** Subscriptions may replay. The page or harness context owns the runtime, not this render. */
export function Connected({ sample, ...appearance }: Props) {
  const state = React.useSyncExternalStore(sample.subscribe, sample.current);
  return (
    <Passkey.UI
      {...appearance}
      snapshot={snapshotOf(state)}
      onCreateAccount={() => void sample.run('create-account')}
      onSignIn={() => void sample.run('sign-in')}
      onAddPasskey={() => void sample.run('add-passkey')}
      onSignOut={() => void sample.run('sign-out')}
    />
  );
}
