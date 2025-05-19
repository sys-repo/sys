import React from 'react';

/**
 * Component factory lookup.
 */
export async function lookup(kind: string): Promise<React.FC | undefined> {
  if (kind === 'sys/tmp/ui:Foo') {
    const { Foo } = await import('@sys/tmp/ui');
    return Foo;
  }

  const players = ['VideoPlayer'];

  if (players.includes(kind)) {
    const { Player } = await import('@sys/ui-react-components');
    if (kind === 'VideoPlayer') return Player.Video.View;
  }

  return; // NB: no-match.
}
