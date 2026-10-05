import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  renderHook,
  Time,
} from '../../../-test.ts';
import { useControlsVisible } from '../use.Controls.Visible.ts';

describe('Player.Video.Element: scoped control delay', () => {
  DomMock.init({ beforeEach, afterEach });

  const initialProps = { playing: true, canPlay: true, pointerOver: false, hideAfter: 0 };

  it('hides controls after the delay elapses', async () => {
    const { result, unmount } = renderHook(useControlsVisible, { initialProps });
    try {
      expect(result.current).to.eql(true);
      await act(async () => {
        await Time.wait(0);
      });
      expect(result.current).to.eql(false);
    } finally {
      unmount();
    }
  });

  it('effect cleanup prevents a stale hide after the pointer returns', async () => {
    const { result, rerender, unmount } = renderHook(useControlsVisible, { initialProps });
    try {
      // Rerender before the timer can run; the previous effect must cancel it.
      rerender({ ...initialProps, pointerOver: true });
      await act(async () => {
        await Time.wait(0);
      });
      expect(result.current).to.eql(true);
    } finally {
      unmount();
    }
  });
});
