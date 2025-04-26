import React from 'react';
import { type t, Button, css } from '../common.ts';

export const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
};

/**
 * Buttons: play/pause controls for media-player signals-API on the stack.
 */
export function videoPlayerButton(component: t.ProgrammeSignals) {
  const media = component.props.media.value;
  const index = component.props.section.value?.index;
  const player = typeof index === 'number' ? media?.children?.[index]?.video : media?.video;

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

/**
 * Buttons: Programme Sections
 */
export function programmeSectionButtons(
  content: t.VideoContent,
  state: t.ProgrammeSignals,
  options: { title?: string } = {},
) {
  const title = options.title ?? 'Programme Sections:';
  const p = state.props;

  const config = (index: number) => {
    const children = content.media?.children ?? [];
    return (
      <Button
        block
        label={() => `Programme: ${children[index]?.title ?? '<undefined>'}`}
        onClick={() => {
          p.align.value = 'Right';
          p.section.value = { index };
        }}
        subscribe={() => p.section.value}
      />
    );
  };

  return (
    <React.Fragment key={'dev.programme-sections'}>
      <div className={Styles.title.class}>{title}</div>
      {config(0)}
      {config(1)}
      {config(2)}
      {config(3)}
      {config(4)}
      {config(5)}
      {config(-1)}
    </React.Fragment>
  );
}
