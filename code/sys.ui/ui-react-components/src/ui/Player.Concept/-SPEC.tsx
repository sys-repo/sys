import { Spec, expect } from '../-test.ui.ts';
import { Debug } from './-SPEC.Debug.tsx';

import { Player } from '../../mod.ts';
import { sampleTimestamps } from '../Player.Thumbnails/-SPEC.sample.ts';
import { ConceptPlayer } from './mod.ts';

export default Spec.describe('VideoPlayer', (e) => {
  const s = Player.Video.signals();

  e.it('API', (e) => {
    expect(Player.Concept.View).to.equal(ConceptPlayer);
  });

  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);
    ctx.subject.size([688, null]).render((e) => {
      return (
        <Player.Concept.View thumbnails={true} timestamps={sampleTimestamps} videoSignals={s} />
      );
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ signals: s }} />);
  });
});
