import React from 'react';

/**
 * Component factory lookup.
 */
export async function lookup(kind: string): Promise<React.FC | undefined> {
  if (kind === 'sys/tmp/ui:Foo') {
    const { Foo } = await import('@sys/tmp/ui');
    return Foo;
  }

  const players = ['ConceptPlayer', 'VideoPlayer', 'Panel'];

  if (players.includes(kind)) {
    const { Player } = await import('@sys/ui-react-components');
    if (kind === 'ConceptPlayer') return Player.Concept.View;
    if (kind === 'VideoPlayer') return Player.Video.View;
  }

  if (kind === 'Panel') {
    const { Panel } = await import('@sys/ui-react-components');
    return Panel;
  }

  return; // NB: no-match.
}
