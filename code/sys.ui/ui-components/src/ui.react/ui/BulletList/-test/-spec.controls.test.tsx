import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { Is, Signal } from '../common.ts';

describe('BulletList specimen controls', () => {
  DomMock.init({ beforeAll, afterAll });

  it('explicit sample actions → change only sample state; rtl reflects the harness flag', async () => {
    const { createDebugSignals, Debug } = await import('../-spec/-SPEC.Debug.tsx');
    const debug = await createDebugSignals();
    debug.reset();
    const p = debug.props;
    p.size.value = 'sm';
    p.columns.value = 2;
    p.width.value = 180;
    p.fontSize.value = 13;
    p.selected.value = ['localhost', 'production'];
    p.multiple.value = true;
    const baseline = Signal.toObject(p);
    const res = await TestReact.render(<Debug debug={debug} />);
    try {
      const panel = res.container.firstElementChild!;
      const children = [...panel.children];
      const heading = children.find((el) => el.textContent === 'Samples');
      expect(heading?.previousElementSibling?.tagName).to.eql('HR');
      const buttons = [...panel.querySelectorAll<HTMLElement>('[role="button"]')];
      const samples = buttons.filter((el) => el.textContent?.startsWith('sample:'));
      expect(samples.map((el) => el.textContent)).to.eql([
        'sample: standard',
        'sample: stress',
        'sample: empty',
      ]);
      expect(heading?.nextElementSibling?.contains(samples[0])).to.eql(true);
      const lastSample = children.find((el) => el.contains(samples[2]));
      expect(lastSample?.nextElementSibling?.tagName).to.eql('HR');
      const debugHeading = children.find((el) => el.textContent === 'Debug');
      expect(debugHeading?.nextElementSibling?.textContent).to.eql('debug: false');

      for (const sample of ['stress', 'empty', 'standard', 'standard'] as const) {
        const button = buttons.find((el) => el.textContent === `sample: ${sample}`);
        if (Is.nil(button)) throw new Error(`Missing sample: ${sample}`);
        await React.act(async () => button.click());
        expect(Signal.toObject(p)).to.eql({ ...baseline, sample });
      }
      const rtl = buttons.find((el) => el.textContent === 'rtl: false');
      if (Is.nil(rtl)) throw new Error('Missing rtl control');
      await React.act(async () => rtl.click());
      expect(p.rtl.value).to.eql(true);
      expect(rtl.textContent).to.eql('rtl: true');
    } finally {
      React.act(() => res.dispose());
    }
  });
});
