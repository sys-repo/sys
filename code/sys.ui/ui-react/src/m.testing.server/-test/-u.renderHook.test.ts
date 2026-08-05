import { afterEach, describe, expect, it } from '@sys/testing';
import { DomMock } from '../common.ts';

afterEach(DomMock.unpolyfill);

describe('renderHook', () => {
  it('lazy-imports @testing-library/react only after DOM is present; act flushes effects', async () => {
    expect((globalThis as any).window).to.equal(undefined);

    const { act, renderHook } = await import('../u.renderHook.ts?test=render-hook-lifecycle');
    const res = renderHook(() => {
      expect((globalThis as any).window).to.be.ok;

      let didRun = false;
      queueMicrotask(() => {
        didRun = true;
      });

      return {
        value: 123,
        didRun: () => didRun,
      };
    });

    try {
      expect(res.result.current.value).to.equal(123);
      expect(res.result.current.didRun()).to.equal(false);

      await act(async () => {
        await Promise.resolve();
      });

      expect(res.result.current.didRun()).to.equal(true);
    } finally {
      res.unmount();
      await DomMock.unpolyfill();
    }
    expect((globalThis as any).window).to.equal(undefined);
  });
});
