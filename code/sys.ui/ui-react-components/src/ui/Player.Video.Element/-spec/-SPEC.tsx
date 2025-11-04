import React from 'react';

import { Color, css, Dev, Signal, Spec, Str } from '../../-test.ui.ts';
import { Player } from '../../Player/m.Player.ts';
import { D } from '../common.ts';
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
        crop={v.crop}
        //
        playing={v.playing}
        autoPlay={v.autoPlay}
        //
        onPlayingChange={(e) => {
          log(`⚡️ onPlayingChange:`, e);
          p.playing.value = e.playing;
        }}
        onMutedChange={(e) => {
          log(`⚡️ onMutedChange:`, e);
          p.muted.value = e.muted;
        }}
        onBufferingChange={(e) => log(`⚡️ onBufferingChange:`, e)}
        onBufferedChange={(e) => log(`⚡️ onBufferedChange:`, e)}
        onEnded={(e) => log('⚡️ onEnded:', e)}
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
    const size = Str.bytes(src.bytes);

    const theme = Color.theme('Dark');
    const styles = {
      base: css({
        Absolute: [null, 0, -25, 0],
        PaddingX: 12,
        fontSize: 10,
        fontFamily: 'monospace',
        color: Color.alpha(theme.fg, 0.5),

        display: 'grid',
        gridAutoFlow: 'column', //          ← Lay items out in columns.
        gridAutoColumns: 'max-content', //  ← Size each implicit column to its content.
        justifyContent: 'start', //         ← Align the whole grid to the left.
        justifyItems: 'start',
        columnGap: 5,
      }),
      size: css({ color: theme.fg }),
      url: css({
        Absolute: [null, 0, -115, 0],
        fontFamily: 'monospace',
        textAlign: 'center',
        fontSize: 12,
        lineHeight: 1.6,
        overflowWrap: 'anywhere',
        wordBreak: 'break-all',
        opacity: 0.3,
        ':hover': { opacity: 1, transition: 'opacity 120ms ease' },
      }),
    };

    const elSizeLabel = (
      <>
        <span>{'network/file-size:'}</span>
        <span className={styles.size.class}>{size}</span>
      </>
    );

    const elUrl = <div className={styles.url.class}>{debug.src}</div>;
    return (
      <>
        {src.bytes > 0 && <div className={styles.base.class}>{elSizeLabel}</div>}
        {props.children}
        {elUrl}
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
