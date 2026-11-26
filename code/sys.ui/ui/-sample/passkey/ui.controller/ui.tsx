import React from 'react';
import type { t } from '../ui/common.ts';
import { Passkey } from '../ui/mod.ts';
import { snapshotOf } from './u.snapshot.ts';

export function UI({ controller, ...appearance }: t.Controller.Props) {
  const state = React.useSyncExternalStore(controller.subscribe, controller.current);
  const { service } = controller;
  const observation = React.useSyncExternalStore(service.subscribe, service.current);
  const link = service.availability;
  const availability = React.useSyncExternalStore(link.subscribe, link.current);
  return (
    <Passkey.UI
      {...appearance}
      snapshot={snapshotOf(state)}
      service={{ observation, availability }}
      onCreateAccount={() => void controller.run('create-account')}
      onSignIn={() => void controller.run('sign-in')}
      onAddPasskey={() => void controller.run('add-passkey')}
      onSignOut={() => void controller.run('sign-out')}
    />
  );
}
