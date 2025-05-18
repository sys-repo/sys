import React from 'react';
import { VIDEO } from '../../-VIDEO.ts';
import { type t, Button, css, D, ObjectView, Player, Signal } from './common.ts';

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
    scale: (e) => e.enlargeBy(2),
    fadeMask: 10,
  });

  const props = {
    debug: s<P['debug']>(false),
    theme: s<P['theme']>('Dark'),
    contentTitle: s<P['contentTitle']>(),
    contentBody: s<P['contentBody']>(),
    columnAlign: s<P['columnAlign']>(D.columnAlign),
    columnVideo: s<P['columnVideo']>(video),
    columnVideoVisible: s<P['columnVideoVisible']>(D.columnVideoVisible),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.debug.value;
      p.theme.value;
      p.contentTitle.value;
      p.contentBody.value;
      p.columnAlign.value;
      p.columnVideoVisible.value;
      video.props.playing.value;
    },
    get is() {
      const p = props;
      return {
        debug: p.debug.value ?? false,
        center: p.columnAlign.value === 'Center',
      };
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

      <hr />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={`columnAlign: ${p.columnAlign.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['columnAlign']>(p.columnAlign, ['Center', 'Right'])}
      />
      <Button
        block
        label={`columnVideoVisible: ${p.columnVideoVisible.value ?? '<undefined>'}`}
        onClick={() => Signal.toggle(p.columnVideoVisible)}
      />

      <hr />
      <div className={Styles.title.class}>{'Media:'}</div>
      <Button
        block
        label={`video.playing: ${p.columnVideo.value?.is.playing}`}
        onClick={() => p.columnVideo.value?.toggle()}
      />

      <hr />
      <ObjectView name={'props'} data={Signal.toObject(debug.props)} expand={1} />
    </div>
  );
};
