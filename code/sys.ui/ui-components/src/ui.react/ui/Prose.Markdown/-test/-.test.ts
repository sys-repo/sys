import { describe, expect, it } from './common.ts';
import { ThematicBreak } from '../m.ThematicBreak.tsx';
import { ProseMarkdown } from '../mod.ts';
import { Markdown } from '../ui.tsx';

describe('Prose.Markdown: module', () => {
  it('exports the public API', async () => {
    const m = await import('@sys/ui-components/react/prose');
    expect(m.Prose.Markdown).to.equal(ProseMarkdown);
    expect(ProseMarkdown.UI).to.equal(Markdown);
    expect(ProseMarkdown.ThematicBreak).to.equal(ThematicBreak);
  });
});
