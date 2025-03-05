import React from 'react';

/**
 * Component factory lookup.
 */
export async function lookup(kind: string): Promise<React.FC | undefined> {
  if (kind === 'sys/tmp/ui:Foo') {
    const { Foo } = await import('@sys/tmp/ui');
    return Foo;
  }

  if (kind === 'ConceptPlayer') {
    const { ConceptPlayer } = await import('@sys/tmp/ui');
    return ConceptPlayer;
  }

  if (kind === 'VideoPlayer') {
    const { VideoPlayer } = await import('@sys/tmp/ui');
    return VideoPlayer;
  }

  return; // NB: not found.
}
