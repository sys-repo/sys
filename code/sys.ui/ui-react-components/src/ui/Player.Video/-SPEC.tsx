import { Spec } from '@sys/ui-react-devharness';
import { VideoPlayer } from './mod.ts';

export default Spec.describe('VideoPlayer', (e) => {
  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);
    ctx.subject.size([520, null]).render((e) => {
      return <VideoPlayer />;
    });
  });
});
