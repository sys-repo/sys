import {
  type t,
  beforeAll,
  describe,
  DomMock,
  expect,
  it,
  renderHook,
  Signal,
  Time,
} from '../../../-test.ts';
import { useDeviceSelectionLifecycle } from '../use.DeviceSelection.Lifecycle.ts';

describe('hook: useDeviceSelectionLifecycle', () => {
  DomMock.polyfill();

  const video = { deviceId: 'v1', kind: 'videoinput', label: 'Cam 1' } as MediaDeviceInfo;
  const mic = { deviceId: 'a1', kind: 'audioinput', label: 'Mic 1' } as MediaDeviceInfo;

  const prefs: t.DeviceDefaultPrefs = {
    kindOrder: ['videoinput', 'audioinput'],
    requireLabel: true,
  };

  function makeSignal<T>(): t.Signal<T | undefined> {
    return Signal.create<T | undefined>(undefined);
  }

  function primeStore(key: string, id: string) {
    localStorage.setItem(key, JSON.stringify({ id }));
  }
  function readStore(key: string) {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as { id?: string }) : {};
  }

  it('derives default when empty (no storage)', async () => {
    const signal = makeSignal<MediaDeviceInfo>();
    const items = [mic, video];
    renderHook(() => useDeviceSelectionLifecycle({ items, signal, prefs, enabled: true }));

    await Time.waitFor(() => signal.value?.deviceId === 'v1');
    expect(signal.value?.deviceId).to.equal('v1'); // first videoinput
  });

  it('restores from storage when present', async () => {
    const signal = makeSignal<MediaDeviceInfo>();
    const items = [mic, video];
    const storageKey = 'test:media:camera';
    primeStore(storageKey, 'v1');

    const enabled = true;
    renderHook(() => useDeviceSelectionLifecycle({ items, signal, prefs, storageKey, enabled }));

    await Time.waitFor(() => signal.value?.deviceId === 'v1');
    expect(signal.value?.deviceId).to.equal('v1');
  });

  it('clears storage if stored device missing and falls back to default (then persists new)', async () => {
    const signal = makeSignal<MediaDeviceInfo>();
    const items = [mic]; // no video present
    const storageKey = 'test:media:camera';
    primeStore(storageKey, 'v1'); // ghost id

    const enabled = true;
    renderHook(() => useDeviceSelectionLifecycle({ items, signal, prefs, storageKey, enabled }));

    await Time.waitFor(() => signal.value?.deviceId === 'a1');
    expect(signal.value?.deviceId).to.equal('a1');
    expect(readStore(storageKey).id).to.equal('a1'); // persisted fallback
  });

  it('preserves selection by deviceId across reorder', async () => {
    const signal = makeSignal<MediaDeviceInfo>();
    const initial = [video, mic];
    const swapped = [mic, video];

    const enabled = true;
    const { rerender } = renderHook(
      (list) => useDeviceSelectionLifecycle({ items: list, signal, prefs, enabled }),
      { initialProps: initial },
    );

    await Time.waitFor(() => signal.value?.deviceId === 'v1');
    expect(signal.value?.deviceId).to.equal('v1');

    rerender(swapped);

    await Time.waitFor(() => signal.value?.deviceId === 'v1');
    expect(signal.value?.deviceId).to.equal('v1'); // unchanged by reorder
  });
});
