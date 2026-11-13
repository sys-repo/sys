import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { D as LabelDefaults } from '../../Text.Label/common.ts';
import { key } from '../../Button/-test/u.fixture.ts';
import type { t } from '../common.ts';
import { BulletList } from '../mod.ts';

const labelSelector = `[data-component="${LabelDefaults.displayName}"]`;

describe('BulletList action labels', () => {
  DomMock.init({ beforeAll, afterAll });

  it('explicit strings → Text.Label once; nodes, ID fallbacks and content stay literal', async () => {
    const literal = '**literal** `code`';
    const items: readonly t.BulletList.Item[] = [
      { id: 'formatted', label: 'Run **build** *now* with `--release`' },
      { id: 'escaped', label: '\\*literal\\* &amp;amp;' },
      { id: '**fallback** `id`' },
      { id: '*null*', label: null },
      { id: 'empty', label: '' },
      { id: 'node', label: <span>{literal}</span> },
      { id: 'fragment', label: <>{'*fragment*'}</> },
      { id: 'number', label: 0 },
      { id: 'hidden', label: false },
      { kind: 'content', key: 'help', render: () => literal },
    ];
    const res = await TestReact.render(<BulletList.UI items={items} />);
    try {
      const list = res.container.querySelector('ul')!;
      expect([...list.children].map((cell) => cell.textContent)).to.eql([
        'Run build now with --release',
        '*literal* &amp;',
        '**fallback** `id`',
        '*null*',
        '',
        literal,
        '*fragment*',
        '0',
        '',
        literal,
      ]);
      const counts = [...list.children].map((cell) => cell.querySelectorAll(labelSelector).length);
      expect(counts).to.eql([1, 1, 0, 0, 1, 0, 0, 0, 0, 0]);
      const formatted = list.children[0].querySelector(labelSelector)!;
      expect(formatted.querySelector('strong')?.textContent).to.eql('build');
      expect(formatted.querySelector('em')?.textContent).to.eql('now');
      expect(formatted.querySelector('code')?.textContent).to.eql('--release');
      expect(formatted.querySelector('a, button, input, [tabindex], [role]')).to.eql(null);
      expect(list.children[1].querySelector('em')).to.eql(null);
      expect(list.children[5].querySelector('span')?.textContent).to.eql(literal);
      expect(list.lastElementChild!.querySelector('[role="button"]')).to.eql(null);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('formatted descendants → Button-owned activation, focus, disabled state and selection', async () => {
    const events: string[] = [];
    let update!: (selected: t.BulletList.Selected) => void;
    function Probe() {
      const [selected, setSelected] = React.useState<t.BulletList.Selected>([]);
      update = setSelected;
      return (
        <BulletList.UI
          selected={selected}
          items={[
            { id: 'run', label: 'Run **build** with `--release`' },
            { id: 'disabled', label: '**Unavailable** `--offline`', enabled: false },
          ]}
          onActivate={({ id }) => events.push(id)}
        />
      );
    }
    const res = await TestReact.render(<Probe />);
    try {
      const buttons = [...res.container.querySelectorAll<HTMLElement>('[role="button"]')];
      const [enabled, disabled] = buttons;
      expect(buttons.map((el) => el.tabIndex)).to.eql([0, -1]);
      expect(res.container.querySelectorAll('[tabindex]').length).to.eql(2);
      React.act(() => enabled.focus());
      expect(enabled.ownerDocument.activeElement).to.equal(enabled);
      key(enabled, 'keydown', 'Enter');
      key(enabled, 'keyup', 'Enter');
      React.act(() => enabled.querySelector('code')!.click());
      React.act(() => disabled.querySelector('code')!.click());
      expect(events).to.eql(['run', 'run']);
      expect(buttons.map((el) => el.getAttribute('aria-pressed'))).to.eql(['false', 'false']);
      expect(disabled.getAttribute('aria-disabled')).to.eql('true');
      React.act(() => update('run'));
      expect(buttons.map((el) => el.getAttribute('aria-pressed'))).to.eql(['true', 'false']);
      expect(enabled.ownerDocument.activeElement).to.equal(enabled);
    } finally {
      React.act(() => res.dispose());
    }
  });
});
