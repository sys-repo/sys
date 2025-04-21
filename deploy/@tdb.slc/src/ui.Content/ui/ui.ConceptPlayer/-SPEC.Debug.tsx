import React from 'react';
import { type t, Button, css, D, ObjectView, Player, Signal, VIDEO } from './common.ts';

type P = t.ConceptPlayerProps;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  const s = Signal.create;

  const video = Player.Video.signals({
    src: VIDEO.GroupScale.src,
    fadeMask: { direction: 'Top:Down', size: 10 },
    scale: (e) => e.enlargeBy(2),
  });

  const props = {
    debug: s<P['debug']>(false),
    theme: s<P['theme']>('Dark'),
    contentTitle: s<P['contentTitle']>(),
    contentBody: s<P['contentBody']>(),
    columnAlign: s<P['columnAlign']>(D.columnAlign),
    columnVideo: s<P['columnVideo']>(video),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.theme.value;
      p.columnAlign.value;
      p.contentTitle.value;
      p.contentBody.value;
      video.props.playing.value;
    },
  };
  init?.(api);
  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
  }),
};

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;

  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{'ConceptPlayer'}</div>

      <Button
        block
        label={`debug: ${p.debug.value ?? '<undefined>'}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button
        block
        label={`align: ${p.columnAlign.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['columnAlign']>(p.columnAlign, ['Center', 'Right'])}
      />

      <hr />

      <Button
        block
        label={`video.playing: ${p.columnVideo.value?.is.playing}`}
        onClick={() => {
          p.columnVideo.value?.toggle();
        }}
      />

      <hr />
      <ObjectView name={'props'} data={Signal.toObject(debug.props)} expand={1} />
    </div>
  );
};
