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

describe('Prose.Markdown.UI: fallback policy', () => {
  DomMock.init({ beforeEach, afterEach });

  it('surfaces unsupported containers while preserving their child text', async () => {
    const ast = {
      type: 'root',
      children: [{
        type: 'paragraph',
        children: [
          { type: 'text', value: 'Keep ' },
          // Intentional unsupported container for runtime fallback coverage.
          { type: 'unknownContainer', children: [{ type: 'text', value: 'child text' }] },
          { type: 'text', value: '.' },
        ],
      }],
    } as unknown as t.Markdown.Ast;

    const res = await TestReact.render(<ProseMarkdown.UI value={ast} />, {
      strict: false,
    });
    try {
      const fallback = res.container.querySelector('[data-prose-markdown-fallback="unsupported"]')!;

      expect(fallback.getAttribute('data-node-type')).to.eql('unknownContainer');
      expect(fallback.textContent).to.eql('Not implemented: unknownContainer');
      expect(res.container.querySelector('p')?.textContent).to.include('child text.');
    } finally {
      res.dispose();
    }
  });

  it('renders unsafe links as plain child text', async () => {
    const source = '[bad](javascript:alert(1)) and [good](/safe).';

    const res = await TestReact.render(<ProseMarkdown.UI value={source} />, {
      strict: false,
    });
    try {
      const links = [...res.container.querySelectorAll('a')];

      expect(res.container.querySelector('p')?.textContent).to.eql('bad and good.');
      expect(links.length).to.eql(1);
      expect(links[0].textContent).to.eql('good');
      expect(links[0].getAttribute('href')).to.eql('/safe');
    } finally {
      res.dispose();
    }
  });

  it('surfaces raw Markdown HTML without rendering or exposing its authored markup', async () => {
    const source = 'Before <strong>raw</strong> after.';

    const res = await TestReact.render(<ProseMarkdown.UI value={source} />, {
      strict: false,
    });
    try {
      const fallbacks = [...res.container.querySelectorAll('[data-node-type="html"]')];

      expect(res.container.querySelector('strong')).to.eql(null);
      expect(fallbacks).to.have.length(2);
      expect(fallbacks.every((element) => element.textContent?.includes('<strong>') === false)).to
        .eql(true);
      expect(res.container.querySelector('p')?.textContent).to.include('raw');
    } finally {
      res.dispose();
    }
  });

  it('surfaces unsupported leaf/value AST nodes without injecting their value', async () => {
    const ast: t.Markdown.Ast = {
      type: 'root',
      children: [{
        type: 'paragraph',
        children: [
          { type: 'text', value: 'Before ' },
          { type: 'html', value: '<img src=x onerror=alert(1)>' },
          { type: 'text', value: ' after.' },
        ],
      }],
    };

    const res = await TestReact.render(<ProseMarkdown.UI value={ast} />, {
      strict: false,
    });
    try {
      const fallback = res.container.querySelector('[data-prose-markdown-fallback="unsupported"]')!;

      expect(res.container.querySelector('img')).to.eql(null);
      expect(fallback.getAttribute('data-node-type')).to.eql('html');
      expect(fallback.textContent).to.eql('Not implemented: html');
      expect(fallback.textContent).to.not.include('<img');
    } finally {
      res.dispose();
    }
  });

  it('surfaces malformed AST children without crashing', async () => {
    const ast = {
      type: 'root',
      children: [
        // Intentional malformed child for runtime hardening coverage.
        null,
        { type: 'paragraph', children: [{ type: 'text', value: 'Safe.' }] },
      ],
    } as unknown as t.Markdown.Ast;

    const res = await TestReact.render(<ProseMarkdown.UI value={ast} />, {
      strict: false,
    });
    try {
      const fallback = res.container.querySelector('[data-prose-markdown-fallback="invalid"]')!;

      expect(res.container.querySelector('[role="alert"]')).to.eql(null);
      expect(fallback.getAttribute('data-node-type')).to.eql('unknown');
      expect(fallback.textContent).to.eql('Invalid node: unknown');
      expect(res.container.querySelector('p')?.textContent).to.eql('Safe.');
    } finally {
      res.dispose();
    }
  });

  it('renders empty Markdown when value is undefined', async () => {
    const res = await TestReact.render(<ProseMarkdown.UI />, {
      strict: false,
    });
    try {
      expect(res.container.querySelector('[role="alert"]')).to.eql(null);
      expect(res.container.textContent).to.eql('');
    } finally {
      res.dispose();
    }
  });

  it('reports explicit null value legibly', async () => {
    const res = await TestReact.render(
      // Intentional explicit null input for runtime hardening coverage.
      <ProseMarkdown.UI value={null as unknown as t.ProseMarkdown.Value} />,
      { strict: false },
    );
    try {
      const alert = res.container.querySelector('[role="alert"]')!;
      expect(alert.textContent).to.eql('Invalid Markdown value.');
    } finally {
      res.dispose();
    }
  });

  it('reports invalid AST value legibly', async () => {
    const res = await TestReact.render(
      // Intentional invalid AST for runtime guard coverage.
      <ProseMarkdown.UI
        value={{ type: 'paragraph', children: [] } as unknown as t.ProseMarkdown.Value}
      />,
      { strict: false },
    );
    try {
      const alert = res.container.querySelector('[role="alert"]')!;
      expect(alert.textContent).to.eql('Invalid Markdown AST.');
    } finally {
      res.dispose();
    }
  });
});
