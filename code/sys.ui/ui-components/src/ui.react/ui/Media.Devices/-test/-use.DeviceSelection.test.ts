import React from 'react';
import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  Is,
  it,
  renderHook,
  type t,
  TestReact,
} from '../../../-test.ts';
import { useDeviceSelection } from '../use.DeviceSelection.ts';

describe('hook: useDeviceSelection', () => {
  DomMock.init({ beforeEach, afterEach });

  const video = { deviceId: 'v1', kind: 'videoinput', label: 'Cam 1' } as MediaDeviceInfo;
  const mic = { deviceId: 'a1', kind: 'audioinput', label: 'Mic 1' } as MediaDeviceInfo;
  const speaker: MediaDeviceInfo = { ...mic, deviceId: 'o1', kind: 'audiooutput', label: 'Out' };

  it('selects the first videoinput by default', () => {
    const items = [mic, video];
    const { result, unmount } = renderHook(() => useDeviceSelection(items));
    try {
      expect(result.current.selected).to.equal(1);

      const args = result.current.toArgs(result.current.selected!);
      expect(args?.device).to.eql(video);
    } finally {
      unmount();
    }
  });

  it('keeps the chosen device through list changes and ranks the remainder after removal', () => {
    const { result, rerender, unmount } = renderHook((list) => useDeviceSelection(list), {
      initialProps: [video, mic],
    });
    const id = () => selectedId(result.current);

    try {
      const select = result.current.setSelected;
      expect(id(), 'initial default').to.equal('v1');
      act(() => select(1));
      expect(id(), 'caller choice').to.equal('a1');

      rerender([mic, video]);
      expect(id(), 'moved choice').to.equal('a1');

      rerender([{ ...mic }, { ...video }, { ...speaker }]);
      expect(id(), 'choice at the same index').to.equal('a1');

      rerender([speaker, video]);
      expect(id(), 'ranked fallback after removal').to.equal('v1');

      act(() => select(0));
      expect(id(), 'retained setter addresses the current list').to.equal('o1');
    } finally {
      unmount();
    }
  });

  it('keeps a numeric seed positional across list changes', () => {
    const { result, rerender, unmount } = renderHook(
      (list) => useDeviceSelection(list, { seed: 1 }),
      { initialProps: [video, mic, speaker] },
    );
    try {
      expect(selectedId(result.current)).to.equal('a1');
      rerender([mic, speaker, video]);
      expect(result.current.selected).to.equal(1);
      expect(selectedId(result.current)).to.equal('o1');
    } finally {
      unmount();
    }
  });

  it('reapplies a device seed by ID on list change, not on every caller choice', () => {
    const items = [video, mic];
    const { result, rerender, unmount } = renderHook(
      (list) => useDeviceSelection(list, { seed: mic }),
      { initialProps: items },
    );
    try {
      expect(result.current.selected).to.equal(1);
      act(() => result.current.setSelected(0));
      expect(result.current.selected).to.equal(0);

      rerender([video]);
      expect(result.current.selected).to.equal(0);
      rerender(items);
      expect(result.current.selected).to.equal(1);
      rerender([mic, video]);
      expect(result.current.selected).to.equal(0);
    } finally {
      unmount();
    }
  });

  it('forgets the caller choice on explicit clear or an empty list', () => {
    const items = [video, mic];
    const { result, rerender, unmount } = renderHook((list) => useDeviceSelection(list), {
      initialProps: items,
    });
    try {
      act(() => result.current.setSelected(1));
      act(() => result.current.setSelected(undefined));
      rerender(items);
      expect(result.current.selected, 'clear on unchanged inputs').to.equal(undefined);
      rerender([...items]);
      expect(result.current.selected, 'default after clear').to.equal(0);

      act(() => result.current.setSelected(1));
      rerender([]);
      expect(result.current.selected, 'empty list').to.equal(undefined);
      rerender(items);
      expect(result.current.selected, 'default after refill').to.equal(0);
    } finally {
      unmount();
    }
  });

  it('applies batched positional choices to the list the caller saw before a reorder', () => {
    const { result, unmount } = renderHook(() => {
      const [swapped, swap] = React.useState(false);
      // Fresh list and preferences even on React's internal retry.
      const items = swapped ? [mic, video, speaker] : [video, mic, speaker];
      return { api: useDeviceSelection(items, { prefs: { requireLabel: true } }), swap };
    });
    try {
      const { api, swap } = result.current;
      act(() => {
        api.setSelected(2);
        api.setSelected(1);
        swap(true);
      });
      expect(selectedId(result.current.api)).to.equal('a1');
    } finally {
      unmount();
    }
  });

  it('a child layout effect selects against the same list it reads', async () => {
    const items = [video, mic];
    const probe = await layoutProbe(items);
    try {
      probe.update(items, (api) => api.setSelected(1));
      expect(probe.id()).to.equal('a1');

      let target: string | undefined;
      probe.update([mic, video], (api) => {
        target = api.toArgs(1)?.device.deviceId;
        api.setSelected(1);
      });
      expect(target).to.equal('v1');
      expect(probe.id()).to.equal(target);
    } finally {
      probe.dispose();
    }
  });

  it('a child first observes the resolving seed when the seeded device returns', async () => {
    const items = [video, mic];
    const probe = await layoutProbe(items, mic);
    try {
      probe.update(items, (api) => api.setSelected(0));
      expect(probe.id()).to.equal('v1');

      const seen: (string | undefined)[] = [];
      const observe = (api: t.DeviceSelectionHook) => seen.push(selectedId(api));
      probe.update([video], observe);
      probe.update([video, { ...mic }], observe);
      expect(seen, 'first child layout observation for each list').to.eql(['v1', 'a1']);
    } finally {
      probe.dispose();
    }
  });
});

/**
 * Helpers:
 */
function selectedId({ selected, toArgs }: t.DeviceSelectionHook) {
  return Is.nil(selected) ? undefined : toArgs(selected)?.device.deviceId;
}

/** Run the observer once per supplied step, not again when the hook settles. */
async function layoutProbe(initial: MediaDeviceInfo[], seed?: MediaDeviceInfo) {
  type Observe = (api: t.DeviceSelectionHook) => void;
  type Step = { items: MediaDeviceInfo[]; observe?: Observe };
  let update!: (step: Step) => void;

  function Parent() {
    const [step, setStep] = React.useState<Step>({ items: initial });
    const api = useDeviceSelection(step.items, { seed });
    React.useLayoutEffect(() => {
      update = setStep;
    }, []);
    return React.createElement(Child, { api, step });
  }

  function Child({ api, step }: { api: t.DeviceSelectionHook; step: Step }) {
    React.useLayoutEffect(() => {
      step.observe?.(api);
    }, [step]);
    return React.createElement('output', null, selectedId(api));
  }

  const view = await TestReact.render(React.createElement(Parent));
  return {
    id: () => view.container.textContent,
    update: (items: MediaDeviceInfo[], observe?: Observe) => act(() => update({ items, observe })),
    dispose: () => view.dispose(),
  };
}
