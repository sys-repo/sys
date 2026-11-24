import React from 'react';
import { WebFixture } from '@sys/testing/web';
import {
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  Is,
  it,
  Json,
  storageFixture,
  type t,
  TestReact,
  Time,
} from '../../../-test.ts';
import { D as ConfigDefaults } from '../../Media.Config/common.ts';
import { Config } from '../../Media.Config/mod.ts';
import { D } from '../common.ts';

type Values = Partial<t.MediaFilterValues>;
const { Filters } = Config;
const debounce = ConfigDefaults.debounce;
const pair = (values?: Values) => [values?.brightness, values?.contrast];

describe('Recorder Debug: filter draft', () => {
  DomMock.init({ beforeEach, afterEach });

  it('delivers both edits in one debounced update while the list stays mounted', async () => {
    using storage = storageFixture();
    using _dom = recorderDom();
    const key = `dev:${D.name}`;
    const initial = Filters.values(['brightness', 'contrast']);
    storage.seed(key, { filters: initial, zoom: {} });
    const stored = () => Json.parse<{ filters: Values }>(localStorage.getItem(key) ?? undefined);
    const { Debug, createDebugSignals } = await import('../-spec/-SPEC.Debug.tsx');
    const debug = createDebugSignals();
    const p = debug.props;
    using events = observeDeliveries();
    const view = await TestReact.render(<Debug debug={debug} />);
    try {
      const brightness = slider(view.container, 'brightness');
      const contrast = slider(view.container, 'contrast');
      const snapshot = () => ({
        labels: [brightness.label(), contrast.label()],
        draft: pair(p.config.filters.value),
        preview: p.filter.value,
        stored: pair(stored()?.filters),
        calls: events.calls.length,
      });
      const baseline = { preview: Filters.toString(initial), stored: [100, 100], calls: 0 };
      expect(snapshot()).to.eql({ ...baseline, labels: ['100%', '100%'], draft: [100, 100] });

      const start = Date.now();
      brightness.set(120);
      await settle(25);
      const first = snapshot();
      const last = contrast.set(150);
      expect(last - start, 'both gestures inside one debounce window').to.be.lessThan(debounce);
      await settle(25);
      const second = snapshot();
      await settle(debounce);

      // Assert after delivery so a stale label cannot hide a separate loss in the payload.
      const final = snapshot();
      const filter = Filters.toString({ ...initial, brightness: 120, contrast: 150 });
      expect(first, 'after brightness').to.eql({
        ...baseline,
        labels: ['120%', '100%'],
        draft: [120, 100],
      });
      expect(second, 'after contrast').to.eql({
        ...baseline,
        labels: ['120%', '150%'],
        draft: [120, 150],
      });
      const delivered = events.calls.map((e) => pair(e.values));
      expect(delivered, 'delivered while mounted').to.eql([[120, 150]]);
      expect(final).to.eql({
        labels: ['120%', '150%'],
        draft: [120, 150],
        preview: filter,
        stored: [120, 150],
        calls: 1,
      });
      expect(events.calls[0].at - last, 'delivery after the last gesture').to.be.at.least(debounce);
    } finally {
      view.dispose();
    }
  });
});

async function settle(ms: number) {
  await React.act(() => Time.wait(ms));
}

/** Supply browser globals used by RecorderHookView and the pointer drag monitor in HappyDOM. */
function recorderDom() {
  const status = {
    target: globalThis,
    key: 'status',
    descriptor: { configurable: true, value: '' },
  };
  const keys = ['addEventListener', 'removeEventListener'] as const;
  const listeners = keys.map((key) => ({
    target: document,
    key,
    descriptor: { configurable: true, value: document[key].bind(document) },
  }));
  return WebFixture.Property.mock('status' in globalThis ? listeners : [status, ...listeners]);
}

/** Keep the real list and handlers; observe the delivery at the Recorder boundary. */
function observeDeliveries() {
  const { List } = Filters.UI;
  const calls: { at: number; values: Values }[] = [];
  const Observed: typeof List = (props) => {
    return (
      <List
        {...props}
        onChanged={(e) => {
          calls.push({ at: Date.now(), values: { ...e.values } });
          props.onChanged?.(e);
        }}
      />
    );
  };
  Object.assign(Filters.UI, { List: Observed });
  return { calls, [Symbol.dispose]: () => Object.assign(Filters.UI, { List }) };
}

/** HappyDOM does not lay out the track. Give the real pointer handler a 200px range. */
function slider(container: HTMLElement, name: 'brightness' | 'contrast') {
  const title = [...container.querySelectorAll('div')].find((el) => el.textContent === name);
  const track = title?.parentElement?.nextElementSibling;
  if (Is.nil(track) || Is.nil(title)) throw new Error(`Missing ${name} slider`);
  Object.defineProperty(track, 'offsetWidth', { configurable: true, value: 200 });
  return {
    label: () => {
      if (!track.isConnected) throw new Error(`Remounted ${name} slider`);
      return title.nextElementSibling?.nextElementSibling?.textContent;
    },
    set(value: number) {
      const clientX = track.getBoundingClientRect().left + value;
      const { PointerEvent } = container.ownerDocument.defaultView!;
      function send(type: string) {
        const e = new PointerEvent(type, { bubbles: true, pointerId: 1, clientX });
        React.act(() => void track!.dispatchEvent(e));
      }
      send('pointerdown');
      const at = Date.now();
      send('pointerup');
      return at;
    },
  };
}
