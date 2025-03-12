import { Spec } from '@sys/ui-react-devharness';
import { sampleTimestamps } from '../Player.Thumbnails/-SPEC.tsx';
import { ConceptPlayer } from './mod.ts';

export default Spec.describe('VideoPlayer', (e) => {
  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);
    ctx.subject.size([520, null]).render((e) => {
      return <ConceptPlayer thumbnails={true} timestamps={sampleTimestamps} />;
    });
  });
});
