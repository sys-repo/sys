import React from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  TestReact,
} from '../../../../-test.ts';
import { D as ChipDefaults } from '../../../ui/Chip/common.ts';
import { D as ProseMarkdownDefaults } from '../../../ui/Prose.Markdown/common.ts';
import { Dev } from '../../mod.ts';
import { DevHelpMarkdown } from '../mod.ts';
import { Str } from '../common.ts';

const value = 'Use `Option + Enter` and [docs](https://example.com/docs).';

describe('@sys/ui-components/react/dev: Dev.Help.Markdown', () => {
  DomMock.init({ beforeEach, afterEach });

  it('exports the public API', async () => {
    const m = await import('@sys/ui-components/react/dev');
    expect(m.Dev).to.equal(Dev);
    expect(m.Dev.Help.Markdown).to.equal(DevHelpMarkdown);
  });

  it('renders Markdown help with dev component defaults', async () => {
    const res = await TestReact.render(
      React.createElement(Dev.Help.Markdown.UI, { value, theme: 'Dark' }),
      { strict: false },
    );

    try {
      const chip = res.container.querySelector(
        `[data-component="${ChipDefaults.displayName}"]`,
      );
      const code = res.container.querySelector('code');
      const anchor = res.container.querySelector('a');
      const root = res.container.querySelector(
        `[data-component="${ProseMarkdownDefaults.displayName}"]`,
      )!;
      const style = root.ownerDocument.defaultView!.getComputedStyle(root);

      expect(res.container.firstElementChild).to.equal(root);
      expect(style.fontSize).to.eql('12px');
      expect(style.lineHeight).to.eql('1.45');
      expect(chip?.textContent).to.eql('Option + Enter');
      expect(code).to.eql(null);
      expect(anchor?.getAttribute('href')).to.eql('https://example.com/docs');
      expect(anchor?.getAttribute('target')).to.eql('_blank');
      expect(anchor?.getAttribute('rel')).to.eql('noopener noreferrer');
      expect(anchor?.textContent).to.eql('docs');
    } finally {
      res.dispose();
    }
  });

  it('gives only absolute HTTP(S) links new-tab cues and preserves authored titles', async () => {
    const value = Str.dedent(`
      - [Docs](HTTPS://example.com/guide?edition=2#links "Authored title")
      - [Archive](http://example.com/archive)
      - [Mail](mailto:help@example.com)
      - [Call](tel:+15551234)
      - [Local](./help "Local title")
      - [Jump](#details)
      - [Untrusted](javascript:alert%281%29)
      - [Protocol relative](//example.com)
    `);
    using res = await TestReact.render(<Dev.Help.Markdown.UI value={value} />);
    const { container } = res;
    const [docs, archive, ...sameContext] = container.querySelectorAll('a');
    expect(docs.getAttribute('href')).to.eql('HTTPS://example.com/guide?edition=2#links');
    expect(docs.title).to.eql('Authored title');
    expect(archive.getAttribute('href')).to.eql('http://example.com/archive');
    expect(archive.title).to.eql('Opens in a new tab');
    for (const link of [docs, archive]) {
      expect(link.getAttribute('target')).to.eql('_blank');
      expect(link.rel).to.eql('noopener noreferrer');
      expect(link.querySelector('[aria-hidden="true"] svg')).not.to.eql(null);
      const hint = link.ownerDocument.getElementById(link.getAttribute('aria-describedby')!);
      expect(hint?.hidden).to.eql(true);
      expect(hint?.textContent).to.eql('Opens in a new tab');
    }
    expect(sameContext.map((link) => link.getAttribute('href'))).to.eql([
      'mailto:help@example.com',
      'tel:+15551234',
      './help',
      '#details',
    ]);
    expect(sameContext.map((link) => link.getAttribute('title'))).to.eql([
      null,
      null,
      'Local title',
      null,
    ]);
    for (const link of sameContext) {
      expect(link.getAttribute('target')).to.eql(null);
      expect(link.hasAttribute('aria-describedby')).to.eql(false);
      expect(link.querySelector('svg')).to.eql(null);
    }
    const items = [...container.querySelectorAll('li')];
    expect(items.slice(-2).map((item) => item.textContent)).to.eql([
      'Untrusted',
      'Protocol relative',
    ]);
  });

  it('honors the link tab-order option without disabling web or local links', async () => {
    const value = '[Docs](https://example.com) and [jump](#details).';
    const Help = Dev.Help.Markdown.UI;
    using res = await TestReact.render(
      <>
        <Help value={value} />
        <Help value={value} linksTabbable={false} />
      </>,
    );
    const links = [...res.container.querySelectorAll('a')];
    expect(links.map((link) => link.getAttribute('tabindex'))).to.eql([null, null, '-1', '-1']);
    expect(links.map((link) => link.getAttribute('href'))).to.eql([
      'https://example.com',
      '#details',
      'https://example.com',
      '#details',
    ]);
  });

  it('merges caller inline-code overrides with the default link renderer', async () => {
    const res = await TestReact.render(
      React.createElement(Dev.Help.Markdown.UI, {
        value,
        renderers: {
          inlineCode: (e) => <strong data-override='inline-code'>{e.value}</strong>,
        },
      }),
      { strict: false },
    );

    try {
      const inline = res.container.querySelector('[data-override="inline-code"]');
      const chip = res.container.querySelector(
        `[data-component="${ChipDefaults.displayName}"]`,
      );
      const anchor = res.container.querySelector('a');

      expect(inline?.textContent).to.eql('Option + Enter');
      expect(chip).to.eql(null);
      expect(anchor?.getAttribute('href')).to.eql('https://example.com/docs');
      expect(anchor?.textContent).to.eql('docs');
    } finally {
      res.dispose();
    }
  });

  it('lets the caller replace new-tab behavior without losing the default chip renderer', async () => {
    using res = await TestReact.render(
      <Dev.Help.Markdown.UI
        value={value}
        renderers={{
          link: ({ href, children }) => <a href={href} data-override='link'>{children}</a>,
        }}
      />,
    );
    const link = res.container.querySelector('a[data-override="link"]');
    const chip = res.container.querySelector(`[data-component="${ChipDefaults.displayName}"]`);
    expect(chip?.textContent).to.eql('Option + Enter');
    expect(link?.getAttribute('href')).to.eql('https://example.com/docs');
    expect(link?.getAttribute('target')).to.eql(null);
    expect(link?.getAttribute('aria-describedby')).to.eql(null);
  });
});
