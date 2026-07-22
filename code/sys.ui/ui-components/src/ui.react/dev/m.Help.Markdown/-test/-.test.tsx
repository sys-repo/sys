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
import { D as ChipDefaults } from '../../../Chip/common.ts';
import { D as ProseMarkdownDefaults } from '../../../Prose.Markdown/common.ts';
import { Dev } from '../../mod.ts';
import { DevHelpMarkdown } from '../mod.ts';

const value = 'Use `Option + Enter` and [docs](https://example.com/docs).';

describe('@sys/ui-components/react/dev: Dev.Help.Markdown', () => {
  DomMock.init({ beforeEach, afterEach });

  it('exports the public API', async () => {
    const m = await import('@sys/ui-components/react/dev');
    expect(m.Dev).to.equal(Dev);
    expect(Dev.Help.Markdown).to.equal(DevHelpMarkdown);
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
      ) as HTMLElement;
      const style = window.getComputedStyle(root);

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

  it('merges caller renderer overrides with the defaults', async () => {
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
});
