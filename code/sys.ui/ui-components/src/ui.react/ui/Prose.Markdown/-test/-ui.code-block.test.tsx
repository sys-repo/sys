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
import { Sample } from '../-spec/-ui.Sample.tsx';

const CODE_VALUE = `const markup = '<strong>safe</strong>';
  return markup;`;

const EQUIVALENT_FENCES = Str.dedent(`
  \`\`\`ts title="example"
  const markup = '<strong>safe</strong>';
    return markup;
  \`\`\`

  ~~~ts title="example"
  const markup = '<strong>safe</strong>';
    return markup;
  ~~~
`);

describe('Prose.Markdown.UI: code blocks', () => {
  DomMock.init({ beforeEach, afterEach });

  it('renders equivalent backtick and tilde fences with native semantics', async () => {
    const res = await TestReact.render(<ProseMarkdown.UI value={EQUIVALENT_FENCES} />, {
      strict: false,
    });

    try {
      const code = [...res.container.querySelectorAll('pre > code')];
      expect(code.map((element) => element.textContent)).to.eql([CODE_VALUE, CODE_VALUE]);
      expect(res.container.querySelector('strong')).to.eql(null);
    } finally {
      res.dispose();
    }
  });

  it('composes the shared source-break renderer into the code-block sample', async () => {
    const renderers = Sample.renderersFor('code-blocks', 'Light');
    const res = await TestReact.render(
      <ProseMarkdown.UI value={Sample.value('code-blocks')} renderers={renderers} />,
      { strict: false },
    );

    try {
      expect(renderers?.thematicBreak).to.equal(ProseMarkdown.ThematicBreak.source);
      const rules = [...res.container.querySelectorAll('hr')];
      const classes = rules.map((element) => element.className);
      expect(classes).to.have.length(2);
      expect(classes[0]).to.not.eql('');
      expect(classes[1]).to.eql(classes[0]);
    } finally {
      res.dispose();
    }
  });

  it('passes equivalent code semantics and exact metadata to overrides', async () => {
    const seen: t.ProseMarkdown.Block.Code.RendererArgs[] = [];
    const res = await TestReact.render(
      <ProseMarkdown.UI
        value={EQUIVALENT_FENCES}
        renderers={{
          codeBlock: (args) => {
            seen.push(args);
            return <div data-code={args.lang}>{args.value}</div>;
          },
        }}
      />,
      { strict: false },
    );

    try {
      const expected = {
        type: 'code',
        value: CODE_VALUE,
        lang: 'ts',
        meta: 'title="example"',
      };
      const semantics = seen.map(({ node, value, lang, meta }) => ({
        type: node.type,
        value,
        lang,
        meta,
      }));

      expect(semantics).to.eql([expected, expected]);
      expect([...res.container.querySelectorAll('[data-code="ts"]')]).to.have.length(2);
    } finally {
      res.dispose();
    }
  });

  it('normalizes nil metadata and falls back from a nullish AST override', async () => {
    const node: t.ProseMarkdown.Block.Code.Node = {
      type: 'code',
      value: 'from AST',
      lang: null,
      meta: null,
    };
    const ast: t.Markdown.Ast = { type: 'root', children: [node] };
    let seen: t.ProseMarkdown.Block.Code.RendererArgs | undefined;
    const res = await TestReact.render(
      <ProseMarkdown.UI
        value={ast}
        renderers={{
          codeBlock: (args) => {
            seen = args;
            return null;
          },
        }}
      />,
      { strict: false },
    );

    try {
      expect(res.container.querySelector('pre > code')?.textContent).to.eql('from AST');
      expect(seen?.node).to.equal(node);
      expect(seen?.lang).to.eql(undefined);
      expect(seen?.meta).to.eql(undefined);
    } finally {
      res.dispose();
    }
  });

  it('does not render malformed code nodes or pass them to overrides', async () => {
    const ast = {
      type: 'root',
      children: [{ type: 'code', value: 42, lang: 'ts' }],
    } as unknown as t.Markdown.Ast;
    let calls = 0;
    const res = await TestReact.render(
      <ProseMarkdown.UI
        value={ast}
        renderers={{
          codeBlock: () => {
            calls += 1;
            return <div data-invalid />;
          },
        }}
      />,
      { strict: false },
    );

    try {
      expect(calls).to.eql(0);
      expect(res.container.querySelector('pre, code, [data-invalid]')).to.eql(null);
      expect(res.container.textContent).to.eql('');
    } finally {
      res.dispose();
    }
  });
});
