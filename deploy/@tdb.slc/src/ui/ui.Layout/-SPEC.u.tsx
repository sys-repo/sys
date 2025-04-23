import React from 'react';
import { Content } from '../../ui.content/mod.ts';
import { type t, Button, Signal } from './common.ts';

export { Content };

/**
 * Used to update a size of a DevHost subject based on the current size-breakpoint.
 */
export const updateForBreakpointSize = (dev: t.DevCtx, app: t.AppSignals) => {
  const breakpoint = app.props.screen.breakpoint.value;
  if (breakpoint === 'Mobile') dev.subject.size([390, 844]);
  if (breakpoint === 'Intermediate') dev.subject.size([600, 650]);
  if (breakpoint === 'Desktop') dev.subject.size('fill');
};

/**
 * Button: push content onto the stack.
 */
export const pushStackButton = (app: t.AppSignals, stage: t.ContentStage) => {
  return (
    <Button
      key={`stack.${stage}`}
      block
      label={`stack.push:( "${stage}" )`}
      onClick={async () => app.stack.push(await Content.factory(stage))}
    />
  );
};

/**
 * Button Set: content pushing and clearing from the stack.
 */
export const pushStackContentButtons = (app: t.AppSignals) => {
  const clear = (leave: number) => {
    return (
      <Button
        block
        key={`stack.clear(${leave ?? 0})`}
        label={`stack.clear${leave > 0 ? `( leave: ${leave} )` : ''}`}
        onClick={() => app.stack.clear(leave)}
      />
    );
  };

  return [
    pushStackButton(app, 'Entry'),
    pushStackButton(app, 'Trailer'),
    pushStackButton(app, 'Overview'),
    pushStackButton(app, 'Programme'),
    <React.Fragment key={'hr:pop'}>
      <hr />
      <Button block label={`stack.pop`} onClick={() => app.stack.pop()} />
    </React.Fragment>,
    clear(1),
    clear(0),
  ];
};

/**
 * Button: cycle through screen breakpoints.
 */
export const screenBreakpointButton = (app: t.AppSignals) => {
  type T = t.BreakpointName;
  const p = app.props;
  const list: T[] = ['Desktop', 'Intermediate', 'Mobile'];
  return (
    <Button
      block
      label={`screen.breakpoint: ${p.screen.breakpoint ?? '<undefined>'}`}
      onClick={() => Signal.cycle<T>(p.screen.breakpoint, list)}
    />
  );
};

/**
 * Buttons: play/pause controls for media-player signals-API on the stack.
 */
export function layerVideoPlayerButtons(app: t.AppSignals) {
  const layers = app.stack.items.filter((layer) => Content.Is.video(layer));
  if (layers.length === 0) return <div>{`(no video layers)`}</div>;

  return layers.map((layer, index) => {
    if (!layer.media) return null;
    const media = Content.Video.media(layer);
    const p = media?.video.props;
    if (!p) return null;
    return (
      <Button
        block
        key={`${layer.id}.${index}`}
        label={() => `[ ${layer.id} ]: playing: ${p.playing.value}`}
        onClick={() => Signal.toggle(p.playing)}
        subscribe={() => p.playing.value}
      />
    );
  });
}
