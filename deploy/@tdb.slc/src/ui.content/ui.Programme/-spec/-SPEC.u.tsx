import React from 'react';
import { type t, Button } from '../common.ts';

/**
 * Buttons: play/pause controls for media-player signals-API on the stack.
 */
export function videoPlayerButton(component: t.ProgrammeSignals) {
  const media = component.props.media.value;
  const index = component.props.section.value?.index;
  const player = typeof index === 'number' ? media?.children?.[index].video : media?.video;

  if (!player) return <div>{`(no video player)`}</div>;
  const p = player.props;

  return (
    <Button
      block
      label={() => `[ Video ]: playing: ${p.playing.value}`}
      onClick={() => player.toggle()}
      subscribe={() => p.playing.value}
    />
  );
}
