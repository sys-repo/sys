import { describe, expect, it } from '../../../-test.ts';
import { ProseMarkdown } from '../mod.ts';
import { Markdown } from '../ui.tsx';

describe('Prose.Markdown', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components');
    expect(m.Prose.Markdown).to.equal(ProseMarkdown);
    expect(ProseMarkdown.UI).to.equal(Markdown);
  });
});
