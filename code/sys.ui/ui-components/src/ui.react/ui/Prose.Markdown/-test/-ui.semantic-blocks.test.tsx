import {
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  Str,
  type t,
  TestReact,
} from './common.ts';
import { ProseMarkdown } from '../mod.ts';

describe('Prose.Markdown.UI: semantic blocks', () => {
  DomMock.init({ beforeEach, afterEach });

  it('renders heading depth with native semantics', async () => {
    const source = Str.dedent(`
      # Alpha

      ### Charlie
    `);
    const res = await TestReact.render(<ProseMarkdown.UI value={source} />, { strict: false });

    try {
      expect(res.container.querySelector('h1')?.textContent).to.eql('Alpha');
      expect(res.container.querySelector('h3')?.textContent).to.eql('Charlie');
    } finally {
      res.dispose();
    }
  });

  it('passes semantic heading children and canonical depth to overrides', async () => {
    let seen: t.ProseMarkdown.Block.Heading.RendererArgs | undefined;
    const res = await TestReact.render(
      <ProseMarkdown.UI
        value='## Bravo'
        renderers={{
          heading: (args) => {
            seen = args;
            return <div data-heading={args.depth}>{args.children}</div>;
          },
        }}
      />,
      { strict: false },
    );

    try {
      expect(res.container.querySelector('[data-heading="2"]')?.textContent).to.eql('Bravo');
      expect(seen?.node.type).to.eql('heading');
      expect(seen?.depth).to.eql(2);
    } finally {
      res.dispose();
    }
  });

  it('surfaces malformed heading depth while preserving safe children', async () => {
    const ast = {
      type: 'root',
      children: [{
        type: 'heading',
        depth: 7,
        children: [{ type: 'text', value: 'Visible.' }],
      }],
    } as unknown as t.Markdown.Ast;
    const res = await TestReact.render(<ProseMarkdown.UI value={ast} />, { strict: false });

    try {
      const fallback = res.container.querySelector('[data-prose-markdown-fallback="invalid"]')!;

      expect(res.container.querySelector('h1, h2, h3, h4, h5, h6')).to.eql(null);
      expect(fallback.getAttribute('data-node-type')).to.eql('heading');
      expect(fallback.textContent).to.eql('InvalidNode:heading');
      expect(res.container.textContent).to.include('Visible.');
    } finally {
      res.dispose();
    }
  });

  it('renders thematic breaks with native semantics', async () => {
    const source = 'Before.\n\n---\n\nAfter.';
    const res = await TestReact.render(<ProseMarkdown.UI value={source} />, { strict: false });

    try {
      expect(res.container.querySelectorAll('hr').length).to.eql(1);
    } finally {
      res.dispose();
    }
  });

  it('passes exact thematic-break source lexemes to overrides', async () => {
    let seen: t.ProseMarkdown.Block.ThematicBreak.RendererArgs | undefined;
    const source = '- - - -\n';
    const res = await TestReact.render(
      <ProseMarkdown.UI
        value={source}
        renderers={{
          thematicBreak: (args) => {
            seen = args;
            return <div data-break={args.lexeme?.marker} data-count={args.lexeme?.count} />;
          },
        }}
      />,
      { strict: false },
    );

    try {
      const rendered = res.container.querySelector('[data-break="-"]');
      expect(rendered?.getAttribute('data-count')).to.eql('4');
      expect(seen?.node.type).to.eql('thematicBreak');
      expect(seen?.lexeme?.raw).to.eql('- - - -');
    } finally {
      res.dispose();
    }
  });

  it('does not invent thematic-break lexemes for caller-provided AST values', async () => {
    const ast: t.Markdown.Ast = { type: 'root', children: [{ type: 'thematicBreak' }] };
    let lexeme: t.Markdown.Source.ThematicBreakLexeme | undefined;
    const res = await TestReact.render(
      <ProseMarkdown.UI
        value={ast}
        renderers={{
          thematicBreak: (args) => {
            lexeme = args.lexeme;
            return <hr data-custom />;
          },
        }}
      />,
      { strict: false },
    );

    try {
      expect(res.container.querySelector('[data-custom="true"]')).to.not.eql(null);
      expect(lexeme).to.eql(undefined);
    } finally {
      res.dispose();
    }
  });
});
