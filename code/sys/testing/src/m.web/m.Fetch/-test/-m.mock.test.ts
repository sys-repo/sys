import { describe, expect, it, type t } from '../../../-test.ts';
import { Fetch } from '../mod.ts';
import { expectFetchDescriptor, fetchDescriptor, restoreFetch } from './u.fixture.ts';

describe('WebFixture.Fetch.mock', () => {
  it('installs the exact replacement without transforming calls or results', async () => {
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

  it('preserves replacement rejection and restores through finally', async () => {
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

  it('restores the exact prior property descriptor', () => {
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

  it('keeps descriptor restoration retryable after failure', () => {
    const before = fetchDescriptor();
    const replacement: t.Fetch = () => Promise.resolve(new Response());
    const nativeDefineProperty = Object.defineProperty;
    const methodDescriptor = Object.getOwnPropertyDescriptor(Object, 'defineProperty')!;
    const failure = new TypeError('descriptor restoration blocked');
    const failRestore: typeof Object.defineProperty = (target, property, attributes) => {
      if (target === globalThis && property === 'fetch') throw failure;
      return nativeDefineProperty(target, property, attributes);
    };

    try {
      const mock = Fetch.mock(replacement);
      let caught: unknown;

      try {
        nativeDefineProperty(Object, 'defineProperty', {
          ...methodDescriptor,
          value: failRestore,
        });
        try {
          mock.dispose();
        } catch (error) {
          caught = error;
        } finally {
          nativeDefineProperty(Object, 'defineProperty', methodDescriptor);
        }

        expect(caught).to.equal(failure);
        expect(globalThis.fetch).to.equal(replacement);

        mock.dispose();
        mock.dispose();
        expectFetchDescriptor(before);
        expect(Object.getOwnPropertyDescriptor(Object, 'defineProperty')).to.eql(methodDescriptor);
      } finally {
        nativeDefineProperty(Object, 'defineProperty', methodDescriptor);
      }
    } finally {
      restoreFetch(before);
    }
  });

  it('restores an absent prior property', () => {
    const native = fetchDescriptor();
    const replacement: t.Fetch = () => Promise.resolve(new Response());

    try {
      expect(Reflect.deleteProperty(globalThis, 'fetch')).to.eql(true);
      expect(fetchDescriptor()).to.eql(undefined);

      const mock = Fetch.mock(replacement);
      try {
        expect(globalThis.fetch).to.equal(replacement);
      } finally {
        mock.dispose();
      }

      expect(fetchDescriptor()).to.eql(undefined);
    } finally {
      restoreFetch(native);
    }
  });

  it('keeps absent-property restoration retryable after failure', () => {
    const native = fetchDescriptor();
    const replacement: t.Fetch = () => Promise.resolve(new Response());
    const nativeDeleteProperty = Reflect.deleteProperty;
    const methodDescriptor = Object.getOwnPropertyDescriptor(Reflect, 'deleteProperty')!;
    const failRestore: typeof Reflect.deleteProperty = (target, property) => {
      if (target === globalThis && property === 'fetch') return false;
      return nativeDeleteProperty(target, property);
    };

    try {
      expect(nativeDeleteProperty(globalThis, 'fetch')).to.eql(true);
      const mock = Fetch.mock(replacement);
      let caught: unknown;

      try {
        Object.defineProperty(Reflect, 'deleteProperty', {
          ...methodDescriptor,
          value: failRestore,
        });
        try {
          mock.dispose();
        } catch (error) {
          caught = error;
        } finally {
          Object.defineProperty(Reflect, 'deleteProperty', methodDescriptor);
        }

        expect(caught).to.be.instanceof(TypeError);
        expect(caught).to.have.property(
          'message',
          'Failed to restore the prior globalThis.fetch state.',
        );
        expect(globalThis.fetch).to.equal(replacement);

        mock.dispose();
        mock.dispose();
        expect(fetchDescriptor()).to.eql(undefined);
        expect(Object.getOwnPropertyDescriptor(Reflect, 'deleteProperty')).to.eql(methodDescriptor);
      } finally {
        Object.defineProperty(Reflect, 'deleteProperty', methodDescriptor);
      }
    } finally {
      restoreFetch(native);
    }
  });

  it('disposes idempotently', () => {
    const before = fetchDescriptor();
    const replacement: t.Fetch = () => Promise.resolve(new Response());

    try {
      const mock = Fetch.mock(replacement);
      mock.dispose();
      mock.dispose();
      expectFetchDescriptor(before);
    } finally {
      restoreFetch(before);
    }
  });

  it('restores properly nested mocks in LIFO order', () => {
    const native = fetchDescriptor();
    const firstFetch: t.Fetch = () => Promise.resolve(new Response('first'));
    const secondFetch: t.Fetch = () => Promise.resolve(new Response('second'));
    let first: t.WebFixtureFetch.Mock | undefined;
    let second: t.WebFixtureFetch.Mock | undefined;

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
      second?.dispose();
      first?.dispose();
      restoreFetch(native);
    }
  });
});
