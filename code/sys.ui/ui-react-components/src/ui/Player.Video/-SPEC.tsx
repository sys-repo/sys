import React from 'react';

import { Dev, Signal, Spec, expect } from '../-test.ui.ts';
import { Player } from '../../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { VideoPlayer } from './mod.ts';

export default Spec.describe('VideoPlayer', (e) => {
  const debug = createDebugSignals();
  const video = debug.video;

  e.it('API', (e) => {
    expect(Player.Video.View).to.equal(VideoPlayer);
  });

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    const updateSize = () => {
      const fill = video.props.background.value;
      if (fill) ctx.subject.size('fill');
      else ctx.subject.size([520, null]);
    };

    Dev.Theme.signalEffect(ctx, debug.props.theme, 1);
    Signal.effect(() => {
      updateSize();
      debug.listen();
      ctx.redraw();
    });
    updateSize();

    ctx.subject.display('grid').render((e) => {
      const p = debug.props;
      return <VideoPlayer signals={video} debug={p.debug.value} theme={p.theme.value} />;
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
