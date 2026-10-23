import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  renderHook,
  Schedule,
  Testing,
} from '../../-test.ts';
import { useDist as useDistImplementation, useDistWith } from './use.Dist.ts';
import { sample } from './use.Dist.sample.ts';
import { useDist } from './mod.ts';

// Synthetic observations deliberately make no claim that the declared digest authenticates bytes.
const invalid = [
  {},
  null,
  [],
  { ...sample, hash: { ...sample.hash, scheme: undefined } },
  { ...sample, hash: { ...sample.hash, scheme: 'unknown' } },
  { ...sample, build: { ...sample.build, size: undefined } },
  { ...sample, build: { ...sample.build, size: null } },
  { ...sample, build: { ...sample.build, builder: [] } },
];
const remote = { ...sample, pkg: { name: 'remote', version: '1.2.3' } };

describe('useDist: supported unpinned observations', () => {
  DomMock.init({ beforeEach, afterEach });
  let location = Object.getOwnPropertyDescriptor(globalThis, 'location');
  let originalFetch = globalThis.fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
    location = Object.getOwnPropertyDescriptor(globalThis, 'location');
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { href: 'https://example.test/app/' },
    });
  });
  afterEach(() => {
    // Own restoration from test setup through unmount failure, not only successful render handles.
    globalThis.fetch = originalFetch;
    if (location) Object.defineProperty(globalThis, 'location', location);
    else Reflect.deleteProperty(globalThis, 'location');
  });

  it('public hook → canonical production implementation', () => {
    expect(useDist).to.equal(useDistImplementation);
  });

  it('unsupported JSON → bounded error, no typed observation and safe formatting', async () => {
    for (const value of invalid) {
      const original = globalThis.fetch;
      const requests: string[] = [];
      globalThis.fetch = (input) => {
        requests.push(String(input));
        return Promise.resolve(responseFor(String(input), value));
      };
      const hook = renderHook(() => useDist());
      try {
        await act(async () => {
          await Schedule.macro();
        });
        expect(hook.result.current.json).to.eql(undefined);
        expect(hook.result.current.error?.message).to.eql('Invalid Dist observation.');
        expect(hook.result.current.toString()).to.eql('(not found)');
        expect(requests).to.eql([new URL('./dist.json', globalThis.location.href).href]);
      } finally {
        hook.unmount();
        globalThis.fetch = original;
      }
    }
  });

  for (const fallback of [false, true]) {
    it(`${fallback ? 'invalid with explicit fallback' : 'supported shape'} → manifest-only observation`, async () => {
      const original = globalThis.fetch;
      const requests: string[] = [];
      globalThis.fetch = (input) => {
        requests.push(String(input));
        return Promise.resolve(responseFor(String(input), fallback ? {} : sample));
      };
      const hook = renderHook(() => useDist({ sampleFallback: fallback }));
      try {
        await act(async () => {
          await Schedule.macro();
        });
        expect(hook.result.current.json).to.eql(sample);
        expect(hook.result.current.is.sample).to.eql(fallback);
        expect(hook.result.current.toString()).to.eql('sample@0.0.0-sample.0-00000');
        expect(hook.result.current.error?.message)
          .to.eql(fallback ? 'Invalid Dist observation.' : undefined);
        expect(requests).to.eql([new URL('./dist.json', globalThis.location.href).href]);
      } finally {
        hook.unmount();
        globalThis.fetch = original;
      }
    });
  }

  it('remote success with fallback permitted → remote provenance', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (input) => Promise.resolve(responseFor(String(input), remote));
    const hook = renderHook(() => useDist({ sampleFallback: true }));
    try {
      await act(async () => {
        await Schedule.macro();
      });
      expect(hook.result.current.json).to.eql(remote);
      expect(hook.result.current.is.sample).to.eql(false);
      expect(hook.result.current.error).to.eql(undefined);
    } finally {
      hook.unmount();
      globalThis.fetch = original;
    }
  });

  for (const fallback of [false, true]) {
    it(`rejected transport, fallback=${fallback} → coherent error and source`, async () => {
      const original = globalThis.fetch;
      globalThis.fetch = () => Promise.reject(new Error('Fixture transport rejected.'));
      const hook = renderHook(() => useDist({ sampleFallback: fallback }));
      try {
        await act(async () => {
          await Schedule.macro();
        });
        expect(hook.result.current.json).to.eql(fallback ? sample : undefined);
        expect(hook.result.current.is.sample).to.eql(fallback);
        expect(hook.result.current.error).to.not.eql(undefined);
      } finally {
        hook.unmount();
        globalThis.fetch = original;
      }
    });
  }

  it('disabling fallback never relabels retained sample as remote during render', async () => {
    const original = globalThis.fetch;
    let requests = 0;
    const next = Promise.withResolvers<Response>();
    const observations: Array<{ json: typeof sample | undefined; sample: boolean }> = [];
    globalThis.fetch = (input) =>
      ++requests === 1 ? Promise.resolve(responseFor(String(input), {})) : next.promise;
    const hook = renderHook(({ fallback }) => {
      const dist = useDist({ sampleFallback: fallback });
      observations.push({ json: dist.json, sample: dist.is.sample });
      return dist;
    }, { initialProps: { fallback: true } });
    try {
      await act(async () => {
        await Schedule.macro();
      });
      expect(hook.result.current.json).to.eql(sample);
      expect(hook.result.current.is.sample).to.eql(true);
      hook.rerender({ fallback: false });
      await act(async () => {
        next.resolve(responseFor(new URL('./dist.json', globalThis.location.href).href, remote));
        await Schedule.macro();
      });
      expect(hook.result.current.json).to.eql(remote);
      expect(hook.result.current.error).to.eql(undefined);
      expect(hook.result.current.is.sample).to.eql(false);
      for (const observed of observations) {
        if (observed.json?.pkg?.name === sample.pkg?.name) expect(observed.sample).to.eql(true);
        if (observed.json?.pkg?.name === remote.pkg.name) expect(observed.sample).to.eql(false);
      }
    } finally {
      next.resolve(new Response());
      hook.unmount();
      globalThis.fetch = original;
    }
  });

  for (const action of ['settle', 'replace', 'unmount'] as const) {
    it(`pending sample loader, ${action} → settled source belongs to the current effect`, async () => {
      const original = globalThis.fetch;
      const entered = Promise.withResolvers<void>();
      const pending = Promise.withResolvers<typeof sample>();
      let requests = 0;
      let loads = 0;
      let renders = 0;
      let signal: AbortSignal | null | undefined;
      globalThis.fetch = (input, init) => {
        if (++requests === 1) signal = init?.signal;
        return Promise.resolve(responseFor(String(input), requests === 1 ? {} : remote));
      };
      const loadSample = () => {
        loads++;
        entered.resolve();
        return pending.promise;
      };
      const hook = renderHook(({ fallback }) => {
        renders++;
        return useDistWith({ sampleFallback: fallback }, loadSample);
      }, { initialProps: { fallback: true } });
      try {
        await act(async () => {
          await entered.promise;
        });
        expect(loads).to.eql(1);
        expect(hook.result.current.json).to.eql(undefined);
        expect(hook.result.current.is.sample).to.eql(false);
        expect(hook.result.current.error?.message).to.eql('Invalid Dist observation.');
        if (action === 'replace') {
          hook.rerender({ fallback: false });
          await act(async () => {
            await Schedule.macro();
          });
          expect(hook.result.current.json).to.eql(remote);
        }
        if (action === 'unmount') hook.unmount();
        const beforeSettlement = renders;
        await act(async () => {
          pending.resolve(sample);
          await Schedule.macro();
        });
        expect(loads).to.eql(1);
        if (action === 'settle') {
          expect(hook.result.current.json).to.eql(sample);
          expect(hook.result.current.is.sample).to.eql(true);
          expect(hook.result.current.error?.message).to.eql('Invalid Dist observation.');
        } else {
          // The completed transport detached its abort bridge before sample loading began.
          expect(signal?.aborted).to.eql(false);
          expect(renders).to.eql(beforeSettlement);
          expect(hook.result.current.json).to.eql(action === 'replace' ? remote : undefined);
          expect(hook.result.current.is.sample).to.eql(false);
          if (action === 'replace') expect(hook.result.current.error).to.eql(undefined);
        }
      } finally {
        pending.resolve(sample);
        hook.unmount();
        globalThis.fetch = original;
      }
    });
  }

  it('replaced pending transport cannot overwrite the newer remote observation', async () => {
    const original = globalThis.fetch;
    const entered = Promise.withResolvers<void>();
    const pending = Promise.withResolvers<Response>();
    let requests = 0;
    let signal: AbortSignal | null | undefined;
    let oldUrl = '';
    globalThis.fetch = (input, init) => {
      if (++requests > 1) return Promise.resolve(responseFor(String(input), remote));
      oldUrl = String(input);
      signal = init?.signal;
      entered.resolve();
      return pending.promise;
    };
    const hook = renderHook(({ fallback }) => useDist({ sampleFallback: fallback }), {
      initialProps: { fallback: false },
    });
    try {
      await entered.promise;
      hook.rerender({ fallback: true });
      await act(async () => {
        await Schedule.macro();
      });
      expect(hook.result.current.json).to.eql(remote);
      await act(async () => {
        pending.resolve(responseFor(oldUrl, sample));
        await Schedule.macro();
      });
      expect(signal?.aborted).to.eql(true);
      expect(requests).to.eql(2);
      expect(hook.result.current.json).to.eql(remote);
      expect(hook.result.current.is.sample).to.eql(false);
      expect(hook.result.current.error).to.eql(undefined);
    } finally {
      pending.resolve(new Response());
      hook.unmount();
      globalThis.fetch = original;
    }
  });

  it('unmount before transport settles → abort and no late observation or sample update', async () => {
    const original = globalThis.fetch;
    const entered = Promise.withResolvers<void>();
    const response = Promise.withResolvers<Response>();
    let signal: AbortSignal | null | undefined;
    let url = '';
    globalThis.fetch = (input, init) => {
      url = String(input);
      signal = init?.signal;
      entered.resolve();
      return response.promise;
    };
    const hook = renderHook(() => useDist({ sampleFallback: true }));
    try {
      await entered.promise;
      const observed = hook.result.current;
      hook.unmount();
      await act(async () => {
        response.resolve(responseFor(url, sample));
        await Schedule.macro();
      });
      expect(signal?.aborted).to.eql(true);
      expect(observed.json).to.eql(undefined);
      expect(observed.toString()).to.eql('(not found)');
    } finally {
      response.resolve(new Response());
      hook.unmount();
      globalThis.fetch = original;
    }
  });
});

function responseFor(url: string, value: unknown): Response {
  const response = Testing.Http.json(value);
  Object.defineProperty(response, 'url', { value: url });
  return response;
}
