import { act } from 'react';
import { Obj } from '@sys/std/obj';
import { FALLBACK_CANARY_NODE_TYPE, MarkdownSample } from '../-spec/-samples/mod.ts';
import { createDebugSignals, Debug } from '../-spec/-SPEC.Debug.tsx';
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

  it('sample activation → one pressed row and the matching preview', async () => {
    const debug = createDebugSignals();
    debug.select('chip');
    const res = await TestReact.render(<Debug debug={debug} />, { strict: false });
    try {
      const selector = '[role="list"] [role="button"]';
      const rows = () => [...res.container.querySelectorAll<HTMLElement>(selector)];
      const pressed = () => rows().filter((row) => row.getAttribute('aria-pressed') === 'true');
      expect(rows()).to.have.length(MarkdownSample.kinds.length);
      expect(pressed().map((row) => row.textContent)).to.eql([
        '@sys/<Chip> + <Anchor> overrides',
      ]);
      expect([...pressed()[0].querySelectorAll('code')].map((code) => code.textContent)).to.eql([
        '@sys/<Chip>',
        '<Anchor>',
      ]);

      const nextLabel = 'thematic-break source DSL';
      const next = rows().find((row) => row.textContent === nextLabel)!;
      await act(async () => {
        next.click();
        await Promise.resolve(); // Flush the signal-driven redraw.
      });
      expect(debug.props.sample.value).to.eql('thematic-breaks');
      expect(pressed().map((row) => row.textContent)).to.eql([nextLabel]);
      expect(debug.props.value.value).to.eql(MarkdownSample.value('thematic-breaks'));
      expect(debug.props.viewport.value).to.eql('scroll');
    } finally {
      res.dispose();
    }
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
