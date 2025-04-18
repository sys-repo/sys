import { Spec, expect } from '../-test.ui.ts';
import { Player } from '../../mod.ts';

import { sampleTimestamps } from './-SPEC.sample.ts';
import { Thumbnails } from './mod.ts';

export default Spec.describe('VideoPlayer', (e) => {
  const s = Player.Video.signals();

  e.it('API', (e) => {
    expect(Player.Timestamp.Thumbnails.View).to.equal(Thumbnails);
  });

  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);
    ctx.subject.size([520, null]).render((e) => {
      return (
        <Player.Timestamp.Thumbnails.View
          timestamps={sampleTimestamps}
          onTimestampClick={(e) => console.info(`⚡️ onTimestampClick:`, e)}
          videoSignals={s}
        />
      );
    });
  });
});
