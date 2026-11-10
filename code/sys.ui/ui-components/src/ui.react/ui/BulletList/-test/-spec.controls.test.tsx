import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { Is, Signal } from '../common.ts';
import { key } from '../../Button/-test/u.fixture.ts';

describe('BulletList specimen controls', () => {
  DomMock.init({ beforeAll, afterAll });

  it('sample choices → controlled sample state, persistence, and reset without changing subject controls', async () => {
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
      const heading = children.find((el) => el.textContent === 'Sample States');
      expect(heading?.previousElementSibling?.tagName).to.eql('HR');
      const buttons = [...panel.querySelectorAll<HTMLElement>('[role="button"]')];
      const list = heading?.nextElementSibling;
      expect(list?.tagName).to.eql('UL');
      const samples = [...list!.querySelectorAll<HTMLElement>('[role="button"]')];
      expect(samples.map((el) => el.textContent)).to.eql(['standard', 'stress', 'empty']);
      const pressed = () => samples.map((el) => el.getAttribute('aria-pressed'));
      expect(pressed()).to.eql(['true', 'false', 'false']);
      const lastSample = children.find((el) => el.contains(samples[2]));
      expect(lastSample?.nextElementSibling?.tagName).to.eql('HR');
      const debugHeading = children.find((el) => el.textContent === 'Debug');
      expect(debugHeading?.nextElementSibling?.textContent).to.eql('debug: false');

      const activations = [
        ['stress', 'Enter'],
        ['empty', ' '],
        ['standard', undefined],
        ['standard', undefined],
      ] as const;
      for (const [sample, input] of activations) {
        const button = samples.find((el) => el.textContent === sample);
        if (Is.nil(button)) throw new Error(`Missing sample: ${sample}`);
        await React.act(async () => {
          if (Is.str(input)) {
            button.focus();
            key(button, 'keydown', input);
            key(button, 'keyup', input);
          } else {
            button.click();
          }
        });
        expect(Signal.toObject(p)).to.eql({ ...baseline, sample });
        expect(pressed()).to.eql(samples.map((el) => String(el === button)));
      }
      await React.act(async () => {
        p.sample.value = 'stress';
        p.selected.value = 'standard';
      });
      expect(pressed()).to.eql(['false', 'true', 'false']);
      const reopened = await createDebugSignals();
      expect(Signal.toObject(reopened.props)).to.eql({
        ...baseline,
        sample: 'stress',
        selected: 'standard',
      });
      const reset = buttons.find((el) => el.textContent === '(reset)');
      if (Is.nil(reset)) throw new Error('Missing reset control');
      await React.act(async () => reset.click());
      expect(pressed()).to.eql(['true', 'false', 'false']);
      expect(p.selected.value).to.eql('localhost');

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
