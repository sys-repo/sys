import React from 'react';

import { css, Dev, Signal, Spec, Str } from '../../-test.ui.ts';
import { Player } from '../../Player/m.Player.ts';
import { D } from '../common.ts';
import { useFileSize, VideoElement } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function UncontrolledSubject() {
    const v = Signal.toObject(p);
    return (
      <VideoElement
        style={{ width: v.width }}
        src={v.src}
        debug={v.debug}
        theme={v.theme}
        muted={v.muted}
        loop={v.loop}
        cornerRadius={v.cornerRadius}
        aspectRatio={v.aspectRatio}
        //
        playing={v.playing}
        autoPlay={v.autoPlay}
        //
        onPlayingChange={(e) => {
          console.info(`⚡️ onPlayingChange:`, e);
          p.playing.value = e.playing;
        }}
        onMutedChange={(e) => {
          console.info(`⚡️ onMutedChange:`, e);
          p.muted.value = e.muted;
        }}
        onEnded={(e) => {
          console.info('⚡️ onEnded:', e);
        }}
      />
    );
  }

  function ControlledSubject() {
    const v = Signal.toObject(p);
    const { width } = v;
    const controller = Player.Video.useSignals(debug.video, { log: true });
    return (
      <VideoElement
        //
        style={{ width }}
        debug={v.debug}
        {...controller.props}
      />
    );
  }

  function Root(props: { children?: React.ReactNode }) {
    const src = useFileSize(p.src.value);
    const size = Str.bytes(src.bytes);

    const styles = {
      base: css({
        Absolute: [null, 0, -25, 0],
        PaddingX: 12,
        fontSize: 10,
        fontFamily: 'monospace',
        opacity: 0.5,
        display: 'grid',
        justifyItems: 'end',
      }),
    };

    return (
      <>
        {src.bytes > 0 && <div className={styles.base.class}>{`file-size: ${size}`}</div>}
        {props.children}
      </>
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject.display('grid').render(() => {
      const controlled = p.controlled.value;
      const el = controlled ? <ControlledSubject /> : <UncontrolledSubject />;
      return <Root>{el}</Root>;
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
