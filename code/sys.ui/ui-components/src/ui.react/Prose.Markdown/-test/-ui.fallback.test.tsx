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

  it('preserves child text for unsupported container nodes', async () => {
    const ast: t.Markdown.Ast = {
      type: 'root',
      children: [{
        type: 'paragraph',
        children: [
          { type: 'text', value: 'Keep ' },
          // @ts-expect-error Intentional unsupported container for runtime fallback coverage.
          { type: 'unknownContainer', children: [{ type: 'text', value: 'child text' }] },
          { type: 'text', value: '.' },
        ],
      }],
    };

    const res = await TestReact.render(<ProseMarkdown.UI value={ast} />, {
      strict: false,
    });
    try {
      expect(res.container.querySelector('p')?.textContent).to.eql('Keep child text.');
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

  it('does not render raw Markdown HTML as HTML', async () => {
    const source = 'Before <strong>raw</strong> after.';

    const res = await TestReact.render(<ProseMarkdown.UI value={source} />, {
      strict: false,
    });
    try {
      expect(res.container.querySelector('strong')).to.eql(null);
      expect(res.container.querySelector('p')?.textContent).to.eql('Before raw after.');
    } finally {
      res.dispose();
    }
  });

  it('drops unsupported leaf/value AST nodes', async () => {
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
      expect(res.container.querySelector('img')).to.eql(null);
      expect(res.container.querySelector('p')?.textContent).to.eql('Before  after.');
    } finally {
      res.dispose();
    }
  });

  it('ignores malformed AST children without crashing', async () => {
    const ast: t.Markdown.Ast = {
      type: 'root',
      children: [
        // @ts-expect-error Intentional malformed child for runtime hardening coverage.
        null,
        { type: 'paragraph', children: [{ type: 'text', value: 'Safe.' }] },
      ],
    };

    const res = await TestReact.render(<ProseMarkdown.UI value={ast} />, {
      strict: false,
    });
    try {
      expect(res.container.querySelector('[role="alert"]')).to.eql(null);
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
      // @ts-expect-error Intentional explicit null input for runtime hardening coverage.
      <ProseMarkdown.UI value={null} />,
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
      // @ts-expect-error Intentional invalid AST for runtime guard coverage.
      <ProseMarkdown.UI value={{ type: 'paragraph', children: [] }} />,
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
