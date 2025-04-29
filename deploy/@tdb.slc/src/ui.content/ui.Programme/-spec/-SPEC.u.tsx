import React from 'react';
import { type t, Button, css } from '../common.ts';
import { CalcSection } from '../use.Section.Controller.ts';

export { CalcSection };

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
export function videoPlayerButton(state: t.ProgrammeSignals) {
  const player = CalcSection.player(state);
  if (!player) return <div>{`(no video player)`}</div>;
  return (
    <Button
      block
      label={() => `[ Video ]: playing: ${player.props.playing.value}`}
      onClick={() => player.toggle()}
      subscribe={() => player.props.playing.value}
    />
  );
}

/**
 * Buttons: Programme Sections
 */
export function programmeSectionButtons(
  content: t.ProgrammeContent,
  options: { title?: string } = {},
) {
  const title = options.title ?? 'Programme Sections:';
  const state = content.state;
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
