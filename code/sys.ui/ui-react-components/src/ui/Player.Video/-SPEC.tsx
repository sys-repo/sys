import { Spec, expect } from '../-ui.test.ts';
import { Player } from '../../mod.ts';
import { VideoPlayer, playerSignalsFactory } from './mod.ts';

export default Spec.describe('VideoPlayer', (e) => {
  const s = playerSignalsFactory();

  e.it('API', (e) => {
    expect(Player.Video).to.equal(VideoPlayer);
  });

  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);
    ctx.subject.size([520, null]).render((e) => {
      return <VideoPlayer signals={s} />;
    });
  });

  e.it('Debug', async (e) => {
    const ctx = Spec.ctx(e);

    const el = (
      <div>
        <div onClick={() => s.jumpTo(12)}>jumpTo(12, play)</div>
        <div onClick={() => s.jumpTo(12, false)}>jumpTo(12, paused)</div>
        <div onClick={() => (s.props.playing.value = !s.props.playing.value)}>play</div>
      </div>
    );

    ctx.debug.row(el);
  });
});
