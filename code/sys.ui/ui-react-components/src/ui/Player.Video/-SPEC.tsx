import { Signal, Spec, expect } from '../-test.ui.ts';
import { Player } from '../../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { VideoPlayer } from './mod.ts';

export default Spec.describe('VideoPlayer', (e) => {
  const debug = createDebugSignals();
  const video = Player.Video.signals({
    // Change defaults: 🐷
    // autoPlay: true,
    // showControls: false,
    // loop: true,
  });

  e.it('API', (e) => {
    expect(Player.Video.View).to.equal(VideoPlayer);
  });

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    const updateSize = () => {
      const fill = debug.props.fill.value;
      if (fill) ctx.subject.size('fill');
      if (!fill) ctx.subject.size([520, null]);
    };

    Signal.effect(updateSize);
    updateSize();

    ctx.subject.display('grid').render((e) => {
      return <VideoPlayer signals={video} />;
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ video, debug }} />);
  });
});
