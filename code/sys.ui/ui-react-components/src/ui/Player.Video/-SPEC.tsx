import { Spec, expect } from '../-test.ui.ts';
import { Player } from '../../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { VideoPlayer } from './mod.ts';

export default Spec.describe('VideoPlayer', (e) => {
  const debug = createDebugSignals();
  const video = Player.Video.signals({
    // Change defaults: 🐷
    // autoPlay: true,
    // showControls: true,
    // loop: true,
  });

  e.it('API', (e) => {
    expect(Player.Video.View).to.equal(VideoPlayer);
  });

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    ctx.subject.size([520, null]).render((e) => {
      return <VideoPlayer signals={video} />;
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ video, debug }} />);
  });
});
