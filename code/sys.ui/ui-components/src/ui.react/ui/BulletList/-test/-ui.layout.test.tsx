import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { D, Is, Style, type t } from '../common.ts';
import { BulletList } from '../mod.ts';

const items: readonly t.BulletList.Item[] = [
  { id: 'a', label: 'A long label that can wrap onto multiple lines' },
  { kind: 'content', key: 'help', render: () => 'Content' },
  { id: 'b', label: 'a'.repeat(120) },
  {
    id: 'c',
    label: (
      <>
        First line<br />Second line
      </>
    ),
  },
  { id: 'd', label: <em>Emphasis</em> },
];

describe('BulletList layout declarations (not browser geometry)', () => {
  DomMock.init({ beforeAll, afterAll });

  it('column input → finite, floored, bounded tracks including content cells', async () => {
    const cases = [
      [undefined, 1],
      [1, 1],
      [2, 2],
      [3, 3],
      [2.9, 2],
      [0, 1],
      [-2, 1],
      [NaN, 1],
      [Infinity, 1],
      [-Infinity, 1],
      [Number.MAX_VALUE, items.length],
    ] as const;
    for (const [columns, expected] of cases) {
      const res = await TestReact.render(<BulletList.UI items={items} columns={columns} />);
      try {
        const list = res.container.querySelector('ul')!;
        expect(style(list).gridTemplateColumns, `columns=${columns}`).to.eql(
          `repeat(${expected}, minmax(0, 1fr))`,
        );
      } finally {
        React.act(() => res.dispose());
      }
    }
    for (const cells of [[], items.slice(0, 1)]) {
      const res = await TestReact.render(<BulletList.UI items={cells} columns={3} />);
      try {
        expect(style(res.container.querySelector('ul')!).gridTemplateColumns).to.eql(
          'repeat(1, minmax(0, 1fr))',
        );
      } finally {
        React.act(() => res.dispose());
      }
    }
  });

  it('mixed cells → shrinking seams, first-line markers and unclipped wrapping labels', async () => {
    const res = await TestReact.render(<BulletList.UI items={items} columns={2} />);
    try {
      const list = res.container.querySelector('ul')!;
      expect(style(list).alignItems).to.eql('start');
      expect(style(list).columnGap).to.eql(D.columnGap);
      for (const cell of list.children) expect(style(cell).minWidth).to.eql('0px');
      const button = list.querySelector('[role="button"]')!;
      const marker = button.querySelector('[aria-hidden="true"]')!;
      const row = marker.parentElement!;
      const label = marker.nextElementSibling!;
      expect(style(row).gridTemplateColumns).to.eql('auto minmax(0, 1fr)');
      expect(style(row).minWidth).to.eql('0px');
      expect(style(row).alignItems).to.eql('start');
      expect(style(row).gap).to.eql(D.markerGap);
      // The mock's CSS parser does not support lh; inspect the actual insertion receipt.
      expect(emitted(marker)).to.include('height: 1lh;');
      expect(style(marker).placeItems).to.eql('center');
      expect(style(label).minWidth).to.eql('0px');
      expect(style(label).overflowWrap).to.eql('anywhere');
      expect(style(label).whiteSpace).to.eql('normal');
      expect(style(label).overflow).not.to.eql('hidden');
      expect(style(list).overflow).not.to.eql('hidden');
      const glyph = marker.firstElementChild!;
      expect(emitted(glyph)).to.include(`width: ${D.markerSize};`);
      expect(emitted(glyph)).to.include(`height: ${D.markerSize};`);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('wrapped rows → tight line rhythm and separate space for the unchanged Button outline', async () => {
    const res = await TestReact.render(<BulletList.UI items={items} />);
    try {
      const list = res.container.querySelector('ul')!;
      expect(style(list).lineHeight).to.eql('1.25');
      expect(emitted(list)).to.include('row-gap: max(0.375em, 6px);');
      const button = list.querySelector<HTMLElement>('[role="button"]')!;
      React.act(() => button.focus());
      expect(button.ownerDocument.activeElement).to.equal(button);
      expect(style(button).getPropertyValue('--sys-button-focus-width')).to.eql('2px');
      expect(style(button).getPropertyValue('--sys-button-focus-offset')).to.eql('2px');
      expect(style(button).overflow).not.to.eql('hidden');
      expect(style(list).overflow).not.to.eql('hidden');
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('named sizes → host-relative typography and geometry in both themes', async () => {
    const sizes: readonly (t.BulletList.Size | undefined)[] = [undefined, 'xs', 'sm', 'md'];
    const themes: readonly t.CommonTheme[] = ['Light', 'Dark'];
    for (const theme of themes) {
      for (const size of sizes) {
        const res = await TestReact.render(
          <div style={{ fontSize: 13 }}>
            <BulletList.UI items={items} size={size} theme={theme} />
          </div>,
        );
        try {
          const list = res.container.querySelector('ul')!;
          expect(emitted(list)).to.include(`font-size: ${D.fontSize[size ?? D.size]};`);
          expect(style(list).lineHeight).to.eql(String(D.lineHeight));
          expect(style(list).columnGap).to.eql(D.columnGap);
          expect(emitted(list)).to.include(`row-gap: ${D.rowGap};`);
          for (const marker of list.querySelectorAll('[aria-hidden="true"]')) {
            expect(emitted(marker.firstElementChild!)).to.include(`width: ${D.markerSize};`);
            expect(style(marker.parentElement!).gap).to.eql(D.markerGap);
            expect(emitted(marker)).to.include('height: 1lh;');
          }
        } finally {
          React.act(() => res.dispose());
        }
      }
    }
  });

  it('caller root styles → override size recipe without changing selection or column order', async () => {
    const res = await TestReact.render(
      <BulletList.UI
        items={items}
        size='xs'
        columns={2}
        selected='b'
        style={{ fontSize: 20, lineHeight: 2, columnGap: '2em', rowGap: '1em' }}
      />,
    );
    try {
      const list = res.container.querySelector('ul')!;
      expect(style(list).fontSize).to.eql('20px');
      expect(style(list).lineHeight).to.eql('2');
      expect(style(list).columnGap).to.eql('2em');
      expect(style(list).rowGap).to.eql('1em');
      expect([...list.querySelectorAll('[role="button"]')].map((el) => {
        return el.getAttribute('aria-pressed');
      })).to.eql(['false', 'true', 'false', 'false']);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('RTL and odd mixed cells → unchanged source/Tab/activation order', async () => {
    const events: string[] = [];
    const res = await TestReact.render(
      <div dir='rtl'>
        <BulletList.UI items={items} columns={3} onActivate={({ id }) => events.push(id)} />
      </div>,
    );
    try {
      const list = res.container.querySelector('ul')!;
      expect([...list.children].map((el) => el.textContent)).to.eql([
        'A long label that can wrap onto multiple lines',
        'Content',
        'a'.repeat(120),
        'First lineSecond line',
        'Emphasis',
      ]);
      const buttons = [...list.querySelectorAll<HTMLElement>('[role="button"]')];
      expect(buttons.map((el) => el.tabIndex)).to.eql([0, 0, 0, 0]);
      for (const button of buttons) React.act(() => button.click());
      expect(events).to.eql(['a', 'b', 'c', 'd']);
    } finally {
      React.act(() => res.dispose());
    }
  });
});

/** Actual CSS text sent to the stylesheet, including units the mock cannot parse. */
function emitted(el: Element) {
  const rule = Style.Dom.stylesheet().rules.items.find(({ selector }) => {
    return selector === `.${el.className}`;
  });
  if (Is.nil(rule)) throw new Error(`Missing emitted rule for ${el.className}`);
  return rule.rule;
}

/** Inspect emitted CSS via the mock DOM; no layout or hit-target assertions. */
function style(el: Element) {
  return el.ownerDocument.defaultView!.getComputedStyle(el);
}
