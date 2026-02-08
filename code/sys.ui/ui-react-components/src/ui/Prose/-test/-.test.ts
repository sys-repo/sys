import { describe, expect, it } from '../../../-test.ts';
import { Prose } from '../mod.ts';

import { ProseManuscript } from '../../Prose.Manuscript/mod.ts';
import { ProseMeasure } from '../../Prose.Measure/mod.ts';

describe(`Prose`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components');
    expect(m.Prose).to.equal(Prose);
    expect(m.Prose.Measure).to.equal(ProseMeasure);
    expect(m.Prose.Manuscript).to.equal(ProseManuscript);
  });
});
