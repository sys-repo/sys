import { describe, expect, it, type t } from '../../../-test.ts';
import { Fetch } from '../mod.ts';
import { expectFetchDescriptor, fetchDescriptor, restoreFetch } from './u.fixture.ts';

describe('WebFixture.Fetch.mock', () => {
  it('replacement → preserves exact calls and results', async () => {
    const before = fetchDescriptor();
    const input = new Request('https://example.test/resource');
    const controller = new AbortController();
    const init: RequestInit = { method: 'POST', signal: controller.signal };
    const response = new Response('fixture');
    let actualInput: t.FetchInput | undefined;
    let actualInit: RequestInit | undefined;
    const replacement: t.Fetch = (nextInput, nextInit) => {
      actualInput = nextInput;
      actualInit = nextInit;
      return Promise.resolve(response);
    };

    try {
      const mock = Fetch.mock(replacement);
      try {
        expect(globalThis.fetch).to.equal(replacement);
        expect(await globalThis.fetch(input, init)).to.equal(response);
        expect(actualInput).to.equal(input);
        expect(actualInit).to.equal(init);
      } finally {
        mock.dispose();
      }

      expectFetchDescriptor(before);
    } finally {
      restoreFetch(before);
    }
  });

  it('replacement rejection → preserves identity and restores through finally', async () => {
    const before = fetchDescriptor();
    const failure = new Error('fetch failed');
    const replacement: t.Fetch = () => Promise.reject(failure);
    let caught: unknown;

    try {
      const mock = Fetch.mock(replacement);
      try {
        await globalThis.fetch('https://example.test/failure');
      } catch (error) {
        caught = error;
      } finally {
        mock.dispose();
      }

      expect(caught).to.equal(failure);
      expectFetchDescriptor(before);
    } finally {
      restoreFetch(before);
    }
  });

  it('disposal → restores the exact prior Fetch descriptor', () => {
    const native = fetchDescriptor();
    const previousFetch: t.Fetch = () => Promise.resolve(new Response('previous'));
    const replacement: t.Fetch = () => Promise.resolve(new Response('replacement'));
    const previous: PropertyDescriptor = {
      configurable: true,
      enumerable: true,
      writable: false,
      value: previousFetch,
    };

    try {
      Object.defineProperty(globalThis, 'fetch', previous);
      const mock = Fetch.mock(replacement);
      try {
        expect(globalThis.fetch).to.equal(replacement);
      } finally {
        mock.dispose();
      }

      expectFetchDescriptor(previous);
    } finally {
      restoreFetch(native);
    }
  });

  it('nested mocks → restore in LIFO order', () => {
    const native = fetchDescriptor();
    const firstFetch: t.Fetch = () => Promise.resolve(new Response('first'));
    const secondFetch: t.Fetch = () => Promise.resolve(new Response('second'));
    let first: t.WebFixture.Fetch.Mock | undefined;
    let second: t.WebFixture.Fetch.Mock | undefined;

    try {
      first = Fetch.mock(firstFetch);
      const firstDescriptor = fetchDescriptor();
      second = Fetch.mock(secondFetch);
      expect(globalThis.fetch).to.equal(secondFetch);

      second.dispose();
      expectFetchDescriptor(firstDescriptor);
      expect(globalThis.fetch).to.equal(firstFetch);

      first.dispose();
      expectFetchDescriptor(native);
    } finally {
      try {
        try {
          second?.dispose();
        } finally {
          first?.dispose();
        }
      } finally {
        restoreFetch(native);
      }
    }
  });
});
