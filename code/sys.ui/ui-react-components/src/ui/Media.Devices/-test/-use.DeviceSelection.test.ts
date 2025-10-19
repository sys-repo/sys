import { describe, DomMock, expect, it, renderHook } from '../../../-test.ts';
import { useDeviceSelection } from '../use.DeviceSelection.ts';

describe('hook: useDeviceSelection', () => {
  DomMock.polyfill();
  const video = { deviceId: 'v1', kind: 'videoinput', label: 'Cam 1' } as MediaDeviceInfo;
  const mic = { deviceId: 'a1', kind: 'audioinput', label: 'Mic 1' } as MediaDeviceInfo;

  it('selects the first videoinput by default', () => {
    const items = [mic, video];
    const { result } = renderHook(() => useDeviceSelection(items));
    expect(result.current.selected).to.equal(1);

    const args = result.current.toArgs(result.current.selected!);
    expect(args?.info).to.eql(video); // safe optional chain
  });

  it('respects seed index', () => {
    const items = [video, mic];
    const { result } = renderHook(() => useDeviceSelection(items, { seed: 1 }));
    expect(result.current.selected).to.equal(1);
  });

  it('respects seed MediaDeviceInfo', () => {
    const items = [video, mic];
    const { result } = renderHook(() => useDeviceSelection(items, { seed: mic }));
    expect(result.current.selected).to.equal(1);
  });

  it('preserves deviceId when items reorder', () => {
    const items = [video, mic];
    const { result, rerender } = renderHook((list) => useDeviceSelection(list), {
      initialProps: items,
    });
    expect(result.current.selected).to.equal(0);

    // Swap order, same deviceIds:
    const swapped = [mic, video];
    rerender(swapped);

    // Should now point to same deviceId ("v1"), which is index 1:
    expect(result.current.selected).to.equal(1);
  });

  it('falls back to new default when previous device removed', () => {
    const initialProps = [video, mic];
    const { result, rerender } = renderHook((list) => useDeviceSelection(list), { initialProps });
    expect(result.current.selected).to.equal(0);

    // Remove video; only mic remains:
    rerender([mic]);
    expect(result.current.selected).to.equal(0); // mic becomes default
  });
});
