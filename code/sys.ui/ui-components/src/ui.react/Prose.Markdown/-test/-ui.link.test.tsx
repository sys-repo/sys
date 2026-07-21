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
import { Anchor } from '../../Anchor/mod.ts';

describe('Prose.Markdown.UI: links', () => {
  DomMock.init({ beforeEach, afterEach });

  it('uses link render overrides for safe links', async () => {
    const renderers: t.ProseMarkdown.Renderers = {
      link: ({ href, title, children }) => (
        <span data-href={href} data-title={title}>{children}</span>
      ),
    };

    const res = await TestReact.render(
      <ProseMarkdown.UI
        value={'Read [docs](https://example.com "Docs title").'}
        renderers={renderers}
      />,
      { strict: false },
    );
    try {
      const link = res.container.querySelector('[data-href]')!;
      expect(link.textContent).to.eql('docs');
      expect(link.getAttribute('data-href')).to.eql('https://example.com');
      expect(link.getAttribute('data-title')).to.eql('Docs title');
      expect(res.container.querySelector('a')).to.eql(null);
    } finally {
      res.dispose();
    }
  });

  it('can render links with Anchor.UI from a caller override', async () => {
    const renderers: t.ProseMarkdown.Renderers = {
      link: ({ href, title, children }) => (
        <Anchor.UI href={href} title={title} target='_blank'>{children}</Anchor.UI>
      ),
    };

    const res = await TestReact.render(
      <ProseMarkdown.UI value={'Open [Anchor.UI](https://example.com).'} renderers={renderers} />,
      { strict: false },
    );
    try {
      const link = res.container.querySelector('a')!;
      expect(link.textContent).to.eql('Anchor.UI');
      expect(link.getAttribute('href')).to.eql('https://example.com');
      expect(link.getAttribute('target')).to.eql('_blank');
      expect(link.getAttribute('rel')).to.eql('noopener noreferrer');
    } finally {
      res.dispose();
    }
  });

  it('composes link and inline-code render overrides', async () => {
    const renderers: t.ProseMarkdown.Renderers = {
      inlineCode: ({ value }) => <span data-chip={value}>{value}</span>,
      link: ({ href, title, children }) => (
        <Anchor.UI href={href} title={title}>{children}</Anchor.UI>
      ),
    };

    const href = '/?dev=chip-spec';
    const res = await TestReact.render(
      <ProseMarkdown.UI value={`- [\`Chip.UI\`](${href})`} renderers={renderers} />,
      { strict: false },
    );
    try {
      const link = res.container.querySelector('a')!;
      const chip = link.querySelector('[data-chip="Chip.UI"]')!;
      expect(link.getAttribute('href')).to.eql(href);
      expect(chip.textContent).to.eql('Chip.UI');
    } finally {
      res.dispose();
    }
  });

  it('does not call link overrides for unsafe hrefs', async () => {
    let calls = 0;
    const renderers: t.ProseMarkdown.Renderers = {
      link: ({ children }) => {
        calls += 1;
        return <span data-link>{children}</span>;
      },
    };

    const res = await TestReact.render(
      <ProseMarkdown.UI value={'Do not [run](javascript:alert(1)).'} renderers={renderers} />,
      { strict: false },
    );
    try {
      expect(calls).to.eql(0);
      expect(res.container.querySelector('a')).to.eql(null);
      expect(res.container.querySelector('[data-link]')).to.eql(null);
      expect(res.container.querySelector('p')?.textContent).to.eql('Do not run.');
    } finally {
      res.dispose();
    }
  });

  it('does not call link overrides for malformed link nodes', async () => {
    let calls = 0;
    const ast = {
      type: 'root',
      children: [{
        type: 'paragraph',
        children: [
          { type: 'text', value: 'Before ' },
          // Intentional malformed link for runtime hardening coverage.
          { type: 'link', url: 123, children: [{ type: 'text', value: 'bad link' }] },
          { type: 'text', value: ' after.' },
        ],
      }],
    } as unknown as t.Markdown.Ast;
    const renderers: t.ProseMarkdown.Renderers = {
      link: ({ children }) => {
        calls += 1;
        return <span data-link>{children}</span>;
      },
    };

    const res = await TestReact.render(<ProseMarkdown.UI value={ast} renderers={renderers} />, {
      strict: false,
    });
    try {
      expect(calls).to.eql(0);
      expect(res.container.querySelector('a')).to.eql(null);
      expect(res.container.querySelector('[data-link]')).to.eql(null);
      expect(res.container.querySelector('p')?.textContent).to.eql('Before bad link after.');
    } finally {
      res.dispose();
    }
  });
});
