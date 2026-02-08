import { describe, expect, it } from '../../../-test.ts';
import { ProseMeasure } from '../mod.ts';
import { Measure } from '../ui.tsx';

describe('Prose.Measure', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components');
    expect(m.Prose.Measure).to.equal(ProseMeasure);
    expect(ProseMeasure.UI).to.equal(Measure);
  });
});
