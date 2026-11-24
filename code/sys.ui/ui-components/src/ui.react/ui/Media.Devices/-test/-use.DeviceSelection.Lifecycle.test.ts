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
  Json,
  renderHook,
  Signal,
  storageFixture,
  type t,
  Time,
} from '../../../-test.ts';
import { useDeviceSelectionLifecycle } from '../use.DeviceSelection.Lifecycle.ts';

/**
 * Tests for the "useDeviceSelectionLifecycle" hook.
 * Focus: restore, fallback, persist, clear, and reorder stability.
 */
describe('hook: useDeviceSelectionLifecycle', () => {
  DomMock.init({ beforeEach, afterEach });

  const video = { deviceId: 'v1', kind: 'videoinput', label: 'Cam 1' } as MediaDeviceInfo;
  const mic = { deviceId: 'a1', kind: 'audioinput', label: 'Mic 1' } as MediaDeviceInfo;
  const prefs: t.DeviceDefaultPrefs = {
    kindOrder: ['videoinput', 'audioinput'],
    requireLabel: true,
  };

  const makeSignal = <T>() => Signal.create<T | undefined>(undefined);

  it('derives default when empty (no storage)', async () => {
    const selected$ = makeSignal<MediaDeviceInfo>();
    const items = [mic, video];

    const { unmount } = renderHook(() =>
      useDeviceSelectionLifecycle({
        items,
        selected: selected$.value,
        enabled: true,
        prefs,
        onResolve: (e) => (selected$.value = e.device),
      })
    );
    try {
      await Time.waitFor(() => selected$.value?.deviceId === 'v1');
      expect(selected$.value?.deviceId).to.equal('v1');
    } finally {
      unmount();
    }
  });

  it('restores persisted choices when fallback would select another device', () => {
    using _storage = storageFixture();
    const items = [video, mic];
    const micFirst: t.DeviceDefaultPrefs = { ...prefs, kindOrder: ['audioinput', 'videoinput'] };
    let micBytes: string;
    let cameraBytes: string;

    // A: accept the default camera, then choose the mic.
    {
      using a = mountSelection(items, prefs);
      expect([...a.resolvedIds], 'A: default resolve').to.eql(['v1']);
      expect(a.selected(), 'A: accepted default').to.equal('v1');

      a.select(mic);
      expect(a.selected(), 'A: caller choice').to.equal('a1');
      micBytes = a.readChoice(mic, 'A: persisted caller choice');
    }

    // B: restore the mic despite camera-first ranking, then remove it.
    {
      using b = mountSelection(items, prefs, micBytes);
      expect([...b.resolvedIds], 'B: cold resolve').to.eql(['a1']);
      expect(b.selected(), 'B: accepted restore').to.equal('a1');

      b.resolvedIds.clear();
      b.replaceItems([video]);
      expect([...b.resolvedIds], 'B: resolve after removal').to.eql(['v1']);
      expect(b.selected(), 'B: accepted replacement').to.equal('v1');
      cameraBytes = b.readChoice(video, 'B: persisted replacement');
    }

    // C: with both devices back, neither fallback nor stale mic bytes can produce camera.
    {
      using c = mountSelection(items, micFirst, cameraBytes);
      expect([...c.resolvedIds], 'C: cold resolve').to.eql(['v1']);
      expect(c.selected(), 'C: accepted replacement on restore').to.equal('v1');
    }
  });

  it('clears ghost (missing device) and persists fallback', async () => {
    const storageKey = 'test:media:ghost';

    // Persist video
    {
      const sel$ = makeSignal<MediaDeviceInfo>();
      const { unmount } = renderHook(() =>
        useDeviceSelectionLifecycle({
          items: [mic, video],
          selected: sel$.value,
          prefs,
          storageKey,
          enabled: true,
          onResolve: (e) => (sel$.value = e.device),
        })
      );
      try {
        await Time.waitFor(() => sel$.value?.deviceId === 'v1');
      } finally {
        unmount();
      }
    }

    // Mount without "v1" (ghost): expect fallback to "a1"
    {
      const sel$ = makeSignal<MediaDeviceInfo>();
      const { unmount } = renderHook(() =>
        useDeviceSelectionLifecycle({
          items: [mic],
          selected: sel$.value,
          prefs,
          storageKey,
          enabled: true,
          onResolve: (e) => (sel$.value = e.device),
        })
      );
      try {
        await Time.waitFor(() => sel$.value?.deviceId === 'a1');
        expect(sel$.value?.deviceId).to.equal('a1');
      } finally {
        unmount();
      }
    }

    // New mount restores new fallback
    {
      const sel$ = makeSignal<MediaDeviceInfo>();
      const { unmount } = renderHook(() =>
        useDeviceSelectionLifecycle({
          items: [mic],
          selected: sel$.value,
          prefs,
          storageKey,
          enabled: true,
          onResolve: (e) => (sel$.value = e.device),
        })
      );
      try {
        await Time.waitFor(() => sel$.value?.deviceId === 'a1');
        expect(sel$.value?.deviceId).to.equal('a1');
      } finally {
        unmount();
      }
    }
  });

  it('preserves selection by deviceId across reorder', async () => {
    const selected$ = makeSignal<MediaDeviceInfo>();
    const initial = [video, mic];
    const swapped = [mic, video];

    const { rerender, unmount } = renderHook(
      (list) =>
        useDeviceSelectionLifecycle({
          items: list,
          selected: selected$.value,
          prefs,
          enabled: true,
          onResolve: (e) => (selected$.value = e.device),
        }),
      { initialProps: initial },
    );
    try {
      await Time.waitFor(() => selected$.value?.deviceId === 'v1');
      expect(selected$.value?.deviceId).to.equal('v1');

      rerender(swapped);

      await Time.waitFor(() => selected$.value?.deviceId === 'v1');
      expect(selected$.value?.deviceId).to.equal('v1');
    } finally {
      unmount();
    }
  });
});

function mountSelection(items: MediaDeviceInfo[], prefs: t.DeviceDefaultPrefs, bytes?: string) {
  // Immutable refs are cached per key. Copy the bytes before the hook opens a new key.
  const storageKey = `test:media:persist:${crypto.randomUUID()}`;
  if (!Is.nil(bytes)) localStorage.setItem(storageKey, bytes);

  const resolvedIds = new Set<string>();
  const view = renderHook((items) => {
    const [selected, select] = React.useState<MediaDeviceInfo>();
    useDeviceSelectionLifecycle({
      items,
      prefs,
      storageKey,
      selected,
      onResolve(e) {
        resolvedIds.add(e.device.deviceId);
        select(e.device);
      },
    });
    return { selected, select };
  }, { initialProps: items, reactStrictMode: true });

  return {
    resolvedIds,
    selected: () => view.result.current.selected?.deviceId,
    select: (device: MediaDeviceInfo) => act(() => view.result.current.select(device)),
    replaceItems: view.rerender,
    readChoice(device: MediaDeviceInfo, label: string) {
      const bytes = localStorage.getItem(storageKey) ?? '';
      const stored = Json.parse<{ id?: string; kind?: MediaDeviceKind }>(bytes);
      expect({ id: stored?.id, kind: stored?.kind }, label).to.eql({
        id: device.deviceId,
        kind: device.kind,
      });
      return bytes;
    },
    [Symbol.dispose]() {
      view.unmount();
      localStorage.removeItem(storageKey);
    },
  };
}
