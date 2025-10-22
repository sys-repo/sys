import { describe, expect, it } from '../../../-test.ts';

describe('Media.Recorder (dev)', () => {
  it('API', async () => {
    const m1 = await import('@sys/ui-react-components/media/recorder/dev');
    const m2 = await import('./mod.ts');
    expect(m1).to.equal(m2);
  });
});
