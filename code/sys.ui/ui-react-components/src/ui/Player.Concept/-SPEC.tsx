import { Spec, expect } from '../-test.ui.ts';

import { Player } from '../../mod.ts';
import { sampleTimestamps } from '../Player.Thumbnails/-SPEC.tsx';
import { ConceptPlayer } from './mod.ts';

export default Spec.describe('VideoPlayer', (e) => {
  const videoSignals = Player.Video.signals();

  e.it('API', (e) => {
    expect(Player.Concept.View).to.equal(ConceptPlayer);
  });

  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);
    ctx.subject.size([688, null]).render((e) => {
      return (
        <Player.Concept.View
          thumbnails={true}
          timestamps={sampleTimestamps}
          videoSignals={videoSignals}
        />
      );
    });
  });

  e.it('Debug', async (e) => {
    const ctx = Spec.ctx(e);
    const s = videoSignals;
    const p = s.props;

    const el = (
      <div>
        <div onClick={() => s.jumpTo(12)}>{`jumpTo(12, play)`}</div>
        <div onClick={() => s.jumpTo(12, { play: false })}>{`jumpTo(12, paused)`}</div>

        <div onClick={() => (p.playing.value = !p.playing.value)}>{`play (toggle)`}</div>
        <div onClick={() => (p.playing.value = true)}>{`play: true`}</div>
        <div onClick={() => (p.playing.value = false)}>{`play: false`}</div>
      </div>
    );

    ctx.debug.row(el);
  });
});
