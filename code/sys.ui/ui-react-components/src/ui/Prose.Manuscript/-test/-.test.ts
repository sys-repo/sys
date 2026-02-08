import { describe, expect, it } from '../../../-test.ts';
import { ProseManuscript } from '../mod.ts';
import { Manuscript } from '../ui.tsx';

describe('Prose.Manuscript', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components');
    expect(m.Prose.Manuscript).to.equal(ProseManuscript);
    expect(ProseManuscript.UI).to.equal(Manuscript);
  });
});
