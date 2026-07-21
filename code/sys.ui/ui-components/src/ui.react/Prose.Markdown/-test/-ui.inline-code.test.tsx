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
import { Chip } from '../../Chip/mod.ts';
import { D as ChipD } from '../../Chip/common.ts';

describe('Prose.Markdown.UI: inline code', () => {
  DomMock.init({ beforeEach, afterEach });

  it('uses inline-code render overrides', async () => {
    const renderers: t.ProseMarkdown.Renderers = {
      inlineCode: ({ value }) => <span data-token={value}>{value}</span>,
    };

    const res = await TestReact.render(
      <ProseMarkdown.UI value={'Press `Enter`.'} renderers={renderers} />,
      { strict: false },
    );
    try {
      const token = res.container.querySelector('[data-token="Enter"]')!;
      expect(token.textContent).to.eql('Enter');
      expect(res.container.querySelector('code')).to.eql(null);
    } finally {
      res.dispose();
    }
  });

  it('can render inline code with Chip.UI from a caller override', async () => {
    const renderers: t.ProseMarkdown.Renderers = {
      inlineCode: ({ value }) => <Chip.UI size='xs' mono>{value}</Chip.UI>,
    };

    const res = await TestReact.render(
      <ProseMarkdown.UI value={'Press `Enter`.'} renderers={renderers} />,
      { strict: false },
    );
    try {
      const chip = res.container.querySelector('p span[data-component]')!;
      expect(chip.getAttribute('data-component')).to.eql(ChipD.displayName);
      expect(chip.textContent).to.eql('Enter');
      expect(res.container.querySelector('code')).to.eql(null);
    } finally {
      res.dispose();
    }
  });

  it('does not call inline-code overrides for malformed inline-code nodes', async () => {
    let calls = 0;
    const ast = {
      type: 'root',
      children: [{
        type: 'paragraph',
        children: [
          { type: 'text', value: 'Before ' },
          // Intentional malformed value for runtime hardening coverage.
          { type: 'inlineCode', value: 123 },
          { type: 'text', value: ' after.' },
        ],
      }],
    } as unknown as t.Markdown.Ast;
    const renderers: t.ProseMarkdown.Renderers = {
      inlineCode: ({ value }) => {
        calls += 1;
        return <span data-token={value}>{value}</span>;
      },
    };

    const res = await TestReact.render(<ProseMarkdown.UI value={ast} renderers={renderers} />, {
      strict: false,
    });
    try {
      expect(calls).to.eql(0);
      expect(res.container.querySelector('[data-token]')).to.eql(null);
      expect(res.container.querySelector('p')?.textContent).to.eql('Before  after.');
    } finally {
      res.dispose();
    }
  });
});
