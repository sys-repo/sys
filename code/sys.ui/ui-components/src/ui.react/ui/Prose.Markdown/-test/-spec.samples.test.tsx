import { Obj } from '@sys/std/obj';
import { FALLBACK_CANARY_NODE_TYPE, MarkdownSample } from '../-spec/-samples/mod.ts';
import { ProseMarkdown } from '../mod.ts';
import { afterEach, beforeEach, describe, DomMock, expect, it, TestReact } from './common.ts';

describe('Prose.Markdown: spec samples', () => {
  DomMock.init({ beforeEach, afterEach });

  it('derives centered or scrolling subject presentation from sample metadata', () => {
    expect(MarkdownSample.viewport('intro')).to.equal('center');
    expect(MarkdownSample.viewport('code-blocks')).to.equal('center');
    expect(MarkdownSample.viewport('fallback-canary')).to.equal('center');
    expect(MarkdownSample.viewport('lists')).to.equal('center');
    expect(MarkdownSample.viewport('thematic-breaks')).to.equal('scroll');
  });

  it('links primitive samples by compact module ID', () => {
    const value = MarkdownSample.value('chip');
    const moduleId = (namespace: string) => Obj.hash(namespace).toString(36);

    expect(value).to.include(`/?dev=${moduleId('sys.ui.component: Chip')}`);
    expect(value).to.include(`/?dev=${moduleId('sys.ui.component: Anchor')}`);
  });

  it('keeps a permanent unsupported-node canary visible', async () => {
    const res = await TestReact.render(
      <ProseMarkdown.UI value={MarkdownSample.value('fallback-canary')} />,
      { strict: false },
    );

    try {
      const fallbacks = [...res.container.querySelectorAll('[data-prose-markdown-fallback]')];

      expect(fallbacks).to.have.length(2);
      expect(fallbacks.map((element) => element.getAttribute('data-node-type'))).to.eql([
        FALLBACK_CANARY_NODE_TYPE,
        FALLBACK_CANARY_NODE_TYPE,
      ]);
      expect(res.container.textContent).to.include('child content remains visible.');
    } finally {
      res.dispose();
    }
  });
});
