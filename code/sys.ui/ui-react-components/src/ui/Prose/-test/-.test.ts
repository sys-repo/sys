import { describe, expect, it } from '../../../-test.ts';
import { Prose } from '../mod.ts';
import { Manuscript } from '../ui.Manscript.tsx';

describe('Prose', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components');
    expect(m.Prose).to.equal(Prose);
    expect(Prose.Manuscript.UI).to.equal(Manuscript);
  });
});
