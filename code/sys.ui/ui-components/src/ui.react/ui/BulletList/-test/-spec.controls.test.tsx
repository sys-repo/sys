import React from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  DomMock,
  expect,
  hostFixture,
  it,
  storageFixture,
  TestReact,
} from '../../../-test.ts';
import { Is, Signal } from '../common.ts';
import { key } from '../../Button/-test/u.fixture.ts';

describe('BulletList specimen controls', () => {
  let storage: ReturnType<typeof storageFixture>;
  let host: Awaited<ReturnType<typeof hostFixture>>;
  beforeAll(() => void (storage = storageFixture()));
  beforeEach(async () => void (host = await hostFixture()));
  afterEach(() => host[Symbol.dispose]());
  afterAll(async () => {
    storage[Symbol.dispose]();
    await DomMock.unpolyfill();
  });

  it('sample choices → controlled sample state, persistence, and reset without changing subject controls', async () => {
    const { createDebugSignals, Debug } = await import('../-spec/-SPEC.Debug.tsx');
    const debug = await createDebugSignals();
    debug.reset();
    debug.attach(host.ctx, {});
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
      expect(samples.map((el) => el.textContent)).to.eql([
        'Standard',
        'Markdown labels',
        'Layout stress',
        'Empty',
      ]);
      const pressed = () => samples.map((el) => el.getAttribute('aria-pressed'));
      expect(pressed()).to.eql(['true', 'false', 'false', 'false']);
      const lastSample = children.find((el) => el.contains(samples[3]));
      expect(lastSample?.nextElementSibling?.tagName).to.eql('HR');
      const debugHeading = children.find((el) => el.textContent === 'Debug');
      expect(debugHeading?.nextElementSibling?.textContent).to.eql('debug: false');

      const activations = [
        ['stress', 'Layout stress', 'Enter'],
        ['empty', 'Empty', ' '],
        ['standard', 'Standard', undefined],
        ['standard', 'Standard', undefined],
        ['markdown', 'Markdown labels', 'Enter'],
      ] as const;
      for (const [sample, label, input] of activations) {
        const button = samples.find((el) => el.textContent === label);
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
      await React.act(async () => void (p.selected.value = 'standard'));
      expect(pressed()).to.eql(['false', 'true', 'false', 'false']);
      const reopened = await createDebugSignals();
      expect(Signal.toObject(reopened.props)).to.eql({
        ...baseline,
        sample: 'markdown',
        selected: 'standard',
      });
      const reset = buttons.find((el) => el.textContent === '(reset)');
      if (Is.nil(reset)) throw new Error('Missing reset control');
      await React.act(async () => reset.click());
      expect(pressed()).to.eql(['true', 'false', 'false', 'false']);
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

  it('Markdown sample → formatted strings, literal boundaries and a disabled action', async () => {
    const { createDebugSignals } = await import('../-spec/-SPEC.Debug.tsx');
    const { Root } = await import('../-spec/-ui.Root.tsx');
    const debug = await createDebugSignals();
    debug.reset();
    debug.attach(host.ctx, {});
    debug.props.sample.value = 'markdown';
    const res = await TestReact.render(<Root debug={debug} />);
    try {
      const buttons = [...res.container.querySelectorAll<HTMLElement>('[role="button"]')];
      expect(buttons.map((el) => el.textContent)).to.eql([
        'Run build with production settings and --release.',
        'deno task build',
        'Save [**help**](/-sample/help)',
        'Keep **literal** `notation`',
        'Disabled action with --offline',
      ]);
      const [formatted, code, unsupported, literal, disabled] = buttons;
      expect(formatted.querySelector('strong')?.textContent).to.eql('build');
      expect(formatted.querySelector('em')?.textContent).to.eql('production');
      expect(formatted.querySelector('code')?.textContent).to.eql('--release');
      expect(code.querySelector('code')?.textContent).to.eql('deno task build');
      expect(unsupported.querySelector('a, strong')).to.eql(null);
      expect(literal.querySelector('strong, code')).to.eql(null);
      expect(disabled.querySelector('strong')?.textContent).to.eql('action');
      expect(disabled.querySelector('code')?.textContent).to.eql('--offline');
      expect(disabled.getAttribute('aria-disabled')).to.eql('true');
    } finally {
      React.act(() => res.dispose());
    }
  });
});
