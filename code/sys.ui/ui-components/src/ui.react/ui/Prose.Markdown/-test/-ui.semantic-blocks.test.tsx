import {
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  type t,
  TestReact,
} from './common.ts';
import { ProseMarkdown } from '../mod.ts';

describe('Prose.Markdown.UI: semantic blocks', () => {
  DomMock.init({ beforeEach, afterEach });

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
