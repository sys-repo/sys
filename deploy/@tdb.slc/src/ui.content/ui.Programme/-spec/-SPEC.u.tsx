import React from 'react';
import { type t, Button, css } from '../common.ts';
import { Calc } from '../u.ts';

export { Calc };

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
export function videoPlayerButton(video?: t.VideoPlayerSignals) {
  if (!video) return <div>{`(no video player)`}</div>;
  return (
    <Button
      block
      label={() => `[ Video ]: playing: ${video.props.playing.value}`}
      onClick={() => video.toggle()}
      subscribe={() => video.props.playing.value}
    />
  );
}

/**
 * Buttons: Programme Sections
 */
export function programmeSectionButtons(
  content: t.ProgrammeContent,
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
        label={() => {
          const title = children[index]?.title;
          const bullet = title ? '- ' : '';
          return `${bullet}${title ?? '<undefined>'}`;
        }}
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
      {config(-1)}
      {config(0)}
      {config(1)}
      {config(2)}
      {config(3)}
      {config(4)}
      {config(5)}
    </React.Fragment>
  );
}
