import React from 'react';
import {
  act,
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  hostFixture,
  it,
  storageFixture,
  TestReact,
} from '../../../-test.ts';
import { D, Is } from '../common.ts';
import { SAMPLE } from '../-spec/-samples.tsx';
import { createDebugSignals, Debug } from '../-spec/-SPEC.Debug.tsx';
import { keydown, keyup } from './u.fixture.keyboard.ts';

const storageKey = `dev:${D.displayName}`;

describe('KeyValue spec UI: sample and motion lists', () => {
  let storage: ReturnType<typeof storageFixture>;
  beforeAll(() => void (storage = storageFixture()));
  afterAll(async () => {
    storage[Symbol.dispose]();
    await DomMock.unpolyfill();
  });

  it('selection and reselection update the existing sample and restore it on reload', async () => {
    storage.seed(storageKey, { sample: 'comprehensive' });
    const debug = createDebugSignals();
    const p = debug.props;
    using host = await hostFixture();
    using _attachment = debug.attach(host.ctx, {});
    const res = await TestReact.render(<Debug debug={debug} />);
    try {
      const none = control(res.container, 'None');
      const simple = control(res.container, 'Simple');
      const comprehensive = control(res.container, 'Comprehensive');
      expect(comprehensive.getAttribute('aria-pressed')).to.eql('true');
      expect(simple.getAttribute('aria-pressed')).to.eql('false');

      await click(simple);
      expect(simple.getAttribute('aria-pressed')).to.eql('true');
      expect(comprehensive.getAttribute('aria-pressed')).to.eql('false');
      expect(storage.read(storageKey)).to.have.property('sample', 'simple');
      const reloaded = createDebugSignals();
      expect(reloaded.props.sample.value).to.eql('simple');
      const sampleIds = reloaded.props.items.value?.map((item) => item.id);
      expect(sampleIds).to.eql(SAMPLE.items('simple')?.map((item) => item.id));

      await act(async () => {
        p.items.value = p.items.value?.slice().reverse();
        pressEnter(simple);
      });
      expect(p.items.value?.map((item) => item.id)).to.eql(sampleIds);

      await click(none);
      expect(none.getAttribute('aria-pressed')).to.eql('true');
      expect(simple.getAttribute('aria-pressed')).to.eql('false');
      expect(p.items.value).to.eql(undefined);
      expect(storage.read(storageKey)).not.to.have.property('sample');
      expect(createDebugSignals().props.sample.value).to.eql(undefined);

      await click(control(res.container, '(reset)'));
      expect(comprehensive.getAttribute('aria-pressed')).to.eql('true');
      expect(p.items.value?.map((item) => item.id)).to.eql(
        SAMPLE.items('comprehensive')?.map((item) => item.id),
      );
    } finally {
      act(() => res.dispose());
    }
  });

  it('motion commands preserve direct children, restore order and are disabled during reorder', async () => {
    storage.seed(storageKey, { sample: 'recursive', reorder: true, animation: true });
    const debug = createDebugSignals();
    const p = debug.props;
    const res = await TestReact.render(<Debug debug={debug} />);
    try {
      const shuffle = control(res.container, 'Shuffle direct children');
      const move = control(res.container, 'Move one direct child');
      const restore = control(res.container, 'Restore sample order');
      const commands = [shuffle, move, restore];
      const before = p.items.value!;
      const beforeIds = before.map((item) => item.id);
      for (const command of commands) {
        expect(command.hasAttribute('aria-pressed')).to.eql(false);
        expect(command.getAttribute('aria-disabled')).to.eql('true');
        await click(command);
        expect(p.items.value).to.equal(before);
      }
      await click(control(res.container, 'animation: true'));
      expect(p.animation.value).to.eql(false);

      const reorder = control(res.container, 'reorder: true');
      await act(async () => pressEnter(control(res.container, 'Turn reorder off')));
      expect(reorder.textContent).to.eql('reorder: false');
      expect(res.container.textContent).not.to.include('Turn reorder off');
      expect(p.animation.value).to.eql(false);
      expect(p.sample.value).to.eql('recursive');
      expect(p.items.value).to.equal(before);
      expect(p.items.value?.map((item) => item.id)).to.eql(beforeIds);
      for (const command of commands) {
        expect(command.getAttribute('aria-disabled')).not.to.eql('true');
      }

      for (const command of [move, shuffle]) {
        await click(command);
        const after = p.items.value!;
        expect(after).to.have.members(before);
        if (command === move) expect(after.map((item) => item.id)).not.to.eql(beforeIds);
      }

      await click(restore);
      expect(p.items.value?.map((item) => item.id)).to.eql(beforeIds);
      const selected = control(res.container, 'Recursive groups');
      expect(selected.getAttribute('aria-pressed')).to.eql('true');
    } finally {
      act(() => res.dispose());
    }
  });
});

function click(el: HTMLElement) {
  return act(async () => el.click());
}

function pressEnter(el: HTMLElement) {
  el.focus();
  keydown(el, 'Enter');
  keyup(el, 'Enter');
}

function control(container: HTMLElement, label: string): HTMLElement {
  const el = [...container.querySelectorAll<HTMLElement>('[role="button"]')]
    .find((el) => el.textContent === label);
  if (Is.nil(el)) throw new Error(`Expected control: ${label}`);
  return el;
}
