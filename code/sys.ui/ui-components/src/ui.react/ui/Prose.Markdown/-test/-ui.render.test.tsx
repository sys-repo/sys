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

describe('Prose.Markdown.UI: rendering', () => {
  DomMock.init({ beforeEach, afterEach });

  it('renders Markdown source paragraphs, inline code, and bullet lists', async () => {
    const source = Str.dedent(`
      Use \`token\` now.

      - first item
      - second \`item\`
    `);

    const res = await TestReact.render(<ProseMarkdown.UI value={source} />, {
      strict: false,
    });
    try {
      const paragraph = res.container.querySelector('p')!;
      const code = paragraph.querySelector('code')!;
      const items = [...res.container.querySelectorAll('li')];

      expect(paragraph.textContent).to.eql('Use token now.');
      expect(code.textContent).to.eql('token');
      expect(items.map((item) => item.textContent)).to.eql(['first item', 'second item']);
    } finally {
      res.dispose();
    }
  });

  it('renders Markdown source strong text, emphasis, and safe links', async () => {
    const source = 'Keep **bold**, *emphasis*, and [link text](https://example.com).';

    const res = await TestReact.render(<ProseMarkdown.UI value={source} />, {
      strict: false,
    });
    try {
      const paragraph = res.container.querySelector('p')!;
      const strong = paragraph.querySelector('strong')!;
      const emphasis = paragraph.querySelector('em')!;
      const link = paragraph.querySelector('a')!;

      expect(paragraph.textContent).to.eql('Keep bold, emphasis, and link text.');
      expect(strong.textContent).to.eql('bold');
      expect(emphasis.textContent).to.eql('emphasis');
      expect(link.textContent).to.eql('link text');
      expect(link.getAttribute('href')).to.eql('https://example.com');
    } finally {
      res.dispose();
    }
  });

  it('renders parsed AST value directly', async () => {
    const ast: t.Markdown.Ast = {
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'From AST.' }] }],
    };

    const res = await TestReact.render(<ProseMarkdown.UI value={ast} />, {
      strict: false,
    });
    try {
      expect(res.container.querySelector('p')?.textContent).to.eql('From AST.');
    } finally {
      res.dispose();
    }
  });
});
