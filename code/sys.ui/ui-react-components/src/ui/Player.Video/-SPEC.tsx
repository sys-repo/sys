import { Spec, expect } from '../-test.ui.ts';
import { Player } from '../../mod.ts';
import { Debug } from './-SPEC.Debug.tsx';
import { VideoPlayer } from './mod.ts';

export default Spec.describe('VideoPlayer', (e) => {
  const s = Player.Video.signals({});

  e.it('API', (e) => {
    expect(Player.Video.View).to.equal(VideoPlayer);
  });

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    ctx.subject.size([520, null]).render((e) => {
      return <VideoPlayer signals={s} />;
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ signals: s }} />);
  });
});
