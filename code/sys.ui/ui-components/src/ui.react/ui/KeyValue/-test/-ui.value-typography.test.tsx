import React from 'react';
import {
  act,
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  it,
  TestReact,
} from '../../../-test.ts';
import type { t } from '../common.ts';
import { KeyValue } from '../mod.ts';
import { firstChild, selectElement } from './u.fixture.cursor.ts';

const sizes = [
  { size: 'xs', base: '10px', mono: '10px' },
  { size: 'sm', base: '11px', mono: '10px' },
  { size: 'md', base: '13px', mono: '12px' },
] as const;

const items: t.KeyValue.Item[] = [
  { k: 'Port', v: 1234, mono: true },
  { k: 'Origin', v: 'https://example.com:1234/', href: true },
  { k: 'Name', v: 'Example service', mono: false },
  { k: 'Host', v: <span>localhost</span>, mono: true },
  { k: 'Help', v: <a href='/help'>/help</a>, mono: true },
];

describe('KeyValue.UI: monospace value sizing', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const kind of ['spaced', 'table'] as const) {
    for (const { size, base, mono } of sizes) {
      for (const globalMono of [false, true]) {
        it(`${kind} ${size}, mono=${globalMono}: sizes only owned mono values`, async () => {
          const res = await TestReact.render(
            <KeyValue.UI items={items} layout={{ kind }} size={size} mono={globalMono} />,
          );
          try {
            const root = firstChild(res.container);
            const rows = [...root.children].map((shell) => {
              const row = selectElement(shell as HTMLElement, ':scope > div');
              return [...row.children].map((cell) => window.getComputedStyle(cell).fontSize);
            });
            expect(window.getComputedStyle(root).fontSize).to.eql(base);
            expect(rows).to.eql([
              [base, mono], // Numeric value, row opts in.
              [base, globalMono ? mono : base], // Generated link inherits the setting.
              [base, base], // Row opts out.
              [base, base], // Caller-rendered element.
              [base, base], // Caller-rendered anchor.
            ]);
            const link = selectElement(root, 'a[href="https://example.com:1234/"]');
            expect(window.getComputedStyle(link).fontSize).to.eql(globalMono ? mono : base);
          } finally {
            act(() => res.dispose());
          }
        });
      }
    }
  }
});
