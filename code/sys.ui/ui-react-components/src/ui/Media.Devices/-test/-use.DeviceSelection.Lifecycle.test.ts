import {
  type t,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  renderHook,
  Signal,
  Time,
} from '../../../-test.ts';
import { useDeviceSelectionLifecycle } from '../use.DeviceSelection.Lifecycle.ts';

/**
 * Tests for the "useDeviceSelectionLifecycle" hook.
 * Focus: restore, fallback, persist, clear, and reorder stability.
 */
describe(
  'hook: useDeviceSelectionLifecycle',
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    DomMock.init(beforeEach, afterEach);

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

      renderHook(() =>
        useDeviceSelectionLifecycle({
          items,
          selected: selected$.value,
          enabled: true,
          prefs,
          onResolve: (e) => (selected$.value = e.device),
        }),
      );

      await Time.waitFor(() => selected$.value?.deviceId === 'v1');
      expect(selected$.value?.deviceId).to.equal('v1');
    });

    it('persists, then restores on fresh mount (end-to-end)', async () => {
      const storageKey = 'test:media:persist';
      const items = [mic, video];

      // Mount A: derive and persist "v1"
      {
        const selA$ = makeSignal<MediaDeviceInfo>();
        const { unmount } = renderHook(() =>
          useDeviceSelectionLifecycle({
            items,
            selected: selA$.value,
            prefs,
            storageKey,
            enabled: true,
            onResolve: (e) => (selA$.value = e.device),
          }),
        );

        await Time.waitFor(() => selA$.value?.deviceId === 'v1');
        expect(selA$.value?.deviceId).to.equal('v1');
        unmount();
      }

      // Mount B: restore from LocalStorage
      {
        const selB$ = makeSignal<MediaDeviceInfo>();
        renderHook(() =>
          useDeviceSelectionLifecycle({
            items,
            selected: selB$.value,
            prefs,
            storageKey,
            enabled: true,
            onResolve: (e) => (selB$.value = e.device),
          }),
        );

        await Time.waitFor(() => selB$.value?.deviceId === 'v1');
        expect(selB$.value?.deviceId).to.equal('v1');
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
          }),
        );
        await Time.waitFor(() => sel$.value?.deviceId === 'v1');
        unmount();
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
          }),
        );
        await Time.waitFor(() => sel$.value?.deviceId === 'a1');
        expect(sel$.value?.deviceId).to.equal('a1');
        unmount();
      }

      // New mount restores new fallback
      {
        const sel$ = makeSignal<MediaDeviceInfo>();
        renderHook(() =>
          useDeviceSelectionLifecycle({
            items: [mic],
            selected: sel$.value,
            prefs,
            storageKey,
            enabled: true,
            onResolve: (e) => (sel$.value = e.device),
          }),
        );
        await Time.waitFor(() => sel$.value?.deviceId === 'a1');
        expect(sel$.value?.deviceId).to.equal('a1');
      }
    });

    it('preserves selection by deviceId across reorder', async () => {
      const selected$ = makeSignal<MediaDeviceInfo>();
      const initial = [video, mic];
      const swapped = [mic, video];

      const { rerender } = renderHook(
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

      await Time.waitFor(() => selected$.value?.deviceId === 'v1');
      expect(selected$.value?.deviceId).to.equal('v1');

      rerender(swapped);

      await Time.waitFor(() => selected$.value?.deviceId === 'v1');
      expect(selected$.value?.deviceId).to.equal('v1');
    });
  },
);
