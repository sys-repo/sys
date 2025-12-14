import React from 'react';

import { InfoPanel } from '../-dev/mod.ts';
import { Color, css, Dev, Signal, Spec } from '../../-test.ui.ts';
import { Player } from '../../Player/m.Player.ts';
import { type t, D } from '../common.ts';
import { useFileSize, VideoElement } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function UncontrolledSubject() {
    const v = Signal.toObject(p);
    const log = (...parts: any) => {
      if (v.debug) console.info(...parts);
    };

    return (
      <VideoElement
        style={{ width: v.width }}
        src={debug.src}
        debug={v.debug}
        theme={v.theme}
        muted={v.muted}
        loop={v.loop}
        cornerRadius={v.cornerRadius}
        aspectRatio={v.aspectRatio}
        scale={v.scale}
        fadeMask={v.fadeMask}
        slice={v.slice}
        controls={v.controls}
        //
        playing={v.playing}
        autoPlay={v.autoPlay}
        //
        onPlayingChange={(e: t.VideoOnPlayingChangeArgs) => {
          log(`⚡️ onPlayingChange:`, e);
          p.playing.value = e.playing;
        }}
        onMutedChange={(e: t.VideoOnMutedChangeArgs) => {
          log(`⚡️ onMutedChange:`, e);
          p.muted.value = e.muted;
        }}
        onBufferingChange={(e: t.VideoOnBufferingChangeArgs) => log(`⚡️ onBufferingChange:`, e)}
        onBufferedChange={(e: t.VideoOnBufferedChangeArgs) => log(`⚡️ onBufferedChange:`, e)}
        onEnded={(e: t.VideoOnEndedArgs) => log('⚡️ onEnded:', e)}
      />
    );
  }

  function ControlledSubject() {
    const v = Signal.toObject(p);
    const { width } = v;
    const log = v.logSignals || v.debug;
    const controller = Player.Video.useSignals(debug.video, { log });
    return (
      <VideoElement
        //
        style={{ width }}
        debug={v.debug}
        theme={v.theme}
        {...controller.props}
      />
    );
  }

  function Root(props: { children?: React.ReactNode }) {
    const src = useFileSize(debug.src);

    const theme = Color.theme('Dark');
    const styles = {
      size: {
        base: css({
          Absolute: [-25, 0, null, 0],
          PaddingX: 12,
          color: Color.alpha(theme.fg, 0.5),
          fontSize: 10,
          fontFamily: 'monospace',

          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: 'max-content',
          justifyContent: 'start',
          justifyItems: 'start',
          columnGap: 5,
        }),
        label: css({}),
      },
      infoPanel: {
        base: css({ Absolute: [null, 20, -30, 20] }),
        inner: css({ Absolute: [0, 0, null, 0], display: 'grid' }),
      },
    };

    const elInfoPanel = p.infoPanel.value && (
      <div className={styles.infoPanel.base.class}>
        <div className={styles.infoPanel.inner.class}>
          <InfoPanel theme={theme.name} src={debug.src} bytes={src.bytes} />
        </div>
      </div>
    );

    return (
      <>
        {props.children}
        {elInfoPanel}
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
