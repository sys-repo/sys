import { describe, expect, it } from '../../-test.ts';
import { DomMock } from '../mod.ts';

describe(
  'Mock (DOM)',

  /** NOTE: leaked timers left around by the "happy-dom" module. */
  { sanitizeOps: false, sanitizeResources: false },

  () => {
    it('API', async () => {
      const m = await import('@sys/std/testing/server');
      expect(m.DomMock).to.equal(DomMock);
    });
  },
);
