import { describe, expect, it, WebFixture } from '../../-test.ts';
import { INPUT_LIMITS, snapshotInput, snapshotProjection } from '../u/u.input.ts';
import { DEFAULT_DEPENDENCIES, type StartDependencies, startWith } from '../u/u.start.ts';
import { catchError, PAGE } from './u.fixture.ts';

describe('BootstrapStatus.start/input', () => {
  it('bounds all synchronous page copying before listener startup', async () => {
    expect(INPUT_LIMITS).to.eql({
      pages: 16,
      keyChars: 128,
      pageBytes: 256 * 1024,
      totalBytes: 1024 * 1024,
    });

    let starts = 0;
    const deps: StartDependencies = {
      ...DEFAULT_DEPENDENCIES,
      startHttp(...args) {
        starts++;
        return DEFAULT_DEPENDENCIES.startHttp(...args);
      },
    };
    const pageAtLimit = new Uint8Array(INPUT_LIMITS.pageBytes);
    const fixedShared = new Uint8Array(new SharedArrayBuffer(1));
    const growableShared = new Uint8Array(new SharedArrayBuffer(1, { maxByteLength: 8 }));
    const detached = new Uint8Array(1);
    structuredClone(detached.buffer, { transfer: [detached.buffer] });
    class Uint8ArraySubclass extends Uint8Array {}
    const subclassed = new Uint8ArraySubclass(1);
    const alteredPrototype = new Uint8Array(1);
    Object.setPrototypeOf(alteredPrototype, {});

    const invalidInputs = [
      {
        pages: Array.from({ length: INPUT_LIMITS.pages + 1 }, (_, index) => ({
          key: `page-${index}`,
          bytes: PAGE,
        })),
        resolve: () => ({ kind: 'page', key: 'page-0' }),
      },
      {
        pages: [{ key: 'x'.repeat(INPUT_LIMITS.keyChars + 1), bytes: PAGE }],
        resolve: () => ({ kind: 'page', key: 'unused' }),
      },
      {
        pages: [{ key: 'oversized', bytes: new Uint8Array(INPUT_LIMITS.pageBytes + 1) }],
        resolve: () => ({ kind: 'page', key: 'oversized' }),
      },
      {
        pages: [
          ...Array.from(
            { length: INPUT_LIMITS.totalBytes / pageAtLimit.byteLength },
            (_, index) => ({ key: `aggregate-${index}`, bytes: pageAtLimit }),
          ),
          { key: 'aggregate-over', bytes: new Uint8Array(1) },
        ],
        resolve: () => ({ kind: 'page', key: 'aggregate-0' }),
      },
      ...[fixedShared, growableShared, detached, subclassed, alteredPrototype].map((
        bytes,
        index,
      ) => ({
        pages: [{ key: `invalid-bytes-${index}`, bytes }],
        resolve: () => ({ kind: 'page', key: `invalid-bytes-${index}` }),
      })),
    ];

    for (const input of invalidInputs) {
      const error = await catchError(() => startWith(input, deps));
      expect(error?.message).to.eql('BootstrapStatus.start invalid input.');
    }
    expect(starts).to.eql(0);

    const resizable = new Uint8Array(new ArrayBuffer(1, { maxByteLength: 8 }));
    const boundaryInputs = [
      {
        pages: Array.from({ length: INPUT_LIMITS.pages }, (_, index) => ({
          key: `page-${index}`,
          bytes: new Uint8Array(),
        })),
        resolve: () => ({ kind: 'page', key: 'page-0' }),
      },
      {
        pages: [{ key: 'x'.repeat(INPUT_LIMITS.keyChars), bytes: pageAtLimit }],
        resolve: () => ({ kind: 'page', key: 'x'.repeat(INPUT_LIMITS.keyChars) }),
      },
      {
        pages: Array.from(
          { length: INPUT_LIMITS.totalBytes / pageAtLimit.byteLength },
          (_, index) => ({ key: `aggregate-${index}`, bytes: pageAtLimit }),
        ),
        resolve: () => ({ kind: 'page', key: 'aggregate-0' }),
      },
      {
        pages: [{ key: 'resizable', bytes: resizable }],
        resolve: () => ({ kind: 'page', key: 'resizable' }),
      },
    ];
    for (const input of boundaryInputs) {
      const started = await startWith(input, deps);
      await started.close('test.boundary');
    }
    expect(starts).to.eql(boundaryInputs.length);
  });

  it('ignores high-cardinality inert extras without enumerating their values', () => {
    let extraReads = 0;
    const page: Record<PropertyKey, unknown> = { key: 'ready', bytes: PAGE };
    const pages = [page];
    const input: Record<PropertyKey, unknown> = {
      pages,
      resolve: () => ({ kind: 'page', key: 'ready' }),
    };
    for (let index = 0; index < 20_000; index++) {
      input[`input-extra-${index}`] = index;
      page[`page-extra-${index}`] = index;
      Object.defineProperty(pages, `pages-extra-${index}`, {
        configurable: true,
        value: index,
      });
    }
    Object.defineProperty(input, 'inert-accessor', {
      enumerable: true,
      get() {
        extraReads++;
        return 'ignored';
      },
    });
    Object.defineProperty(page, 'inert-accessor', {
      enumerable: true,
      get() {
        extraReads++;
        return 'ignored';
      },
    });

    const prepared = snapshotInput(input);
    expect(prepared?.pages.size).to.eql(1);
    expect(prepared?.pages.get('ready')).to.eql(PAGE);
    expect(extraReads).to.eql(0);
  });

  it('uses captured reflection while snapshotting input and resolver projections', () => {
    const originalApply = Reflect.apply;
    const attacks = [
      { target: Reflect, key: 'apply', value: originalApply },
      {
        target: Object,
        key: 'getOwnPropertyDescriptor',
        value: Object.getOwnPropertyDescriptor,
      },
      { target: Object, key: 'freeze', value: Object.freeze },
      { target: Object, key: 'getPrototypeOf', value: Object.getPrototypeOf },
    ] as const;

    for (const attack of attacks) {
      let ambientCalls = 0;
      let prepared: ReturnType<typeof snapshotInput>;
      let projection: ReturnType<typeof snapshotProjection>;
      {
        using _mock = WebFixture.Property.mock([{
          target: attack.target,
          key: attack.key,
          descriptor: {
            configurable: true,
            value: (...args: unknown[]) => {
              ambientCalls += 1;
              return originalApply(attack.value, attack.target, args);
            },
          },
        }]);
        prepared = snapshotInput({
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
        });
        projection = snapshotProjection({ kind: 'page', key: 'ready' });
        expect(snapshotProjection(Promise.resolve({ kind: 'page', key: 'ready' }))).to.eql(
          undefined,
        );
      }
      expect({ key: attack.key, ambientCalls, pages: prepared?.pages.size, projection }).to.eql({
        key: attack.key,
        ambientCalls: 0,
        pages: 1,
        projection: { kind: 'page', key: 'ready' },
      });
    }
  });

  it('rejects accessors and nested Proxies without invoking caller authority', async () => {
    let accessorCalls = 0;
    const pagesAccessor = { resolve: () => ({ kind: 'page', key: 'ready' }) };
    Object.defineProperty(pagesAccessor, 'pages', {
      enumerable: true,
      get() {
        accessorCalls++;
        return [{ key: 'ready', bytes: PAGE }];
      },
    });
    const resolveAccessor = { pages: [{ key: 'ready', bytes: PAGE }] };
    Object.defineProperty(resolveAccessor, 'resolve', {
      enumerable: true,
      get() {
        accessorCalls++;
        return () => ({ kind: 'page', key: 'ready' });
      },
    });
    const indexAccessor: unknown[] = [];
    Object.defineProperty(indexAccessor, '0', {
      enumerable: true,
      get() {
        accessorCalls++;
        return { key: 'ready', bytes: PAGE };
      },
    });
    const keyAccessor = { bytes: PAGE };
    Object.defineProperty(keyAccessor, 'key', {
      enumerable: true,
      get() {
        accessorCalls++;
        return 'ready';
      },
    });
    const bytesAccessor = { key: 'ready' };
    Object.defineProperty(bytesAccessor, 'bytes', {
      enumerable: true,
      get() {
        accessorCalls++;
        return PAGE;
      },
    });

    let proxyTraps = 0;
    const handler: ProxyHandler<object> = {
      get() {
        proxyTraps++;
        throw new Error('nested proxy get trap');
      },
      getPrototypeOf() {
        proxyTraps++;
        throw new Error('nested proxy prototype trap');
      },
      ownKeys() {
        proxyTraps++;
        throw new Error('nested proxy keys trap');
      },
    };
    const revokedPages = Proxy.revocable([{ key: 'ready', bytes: PAGE }], handler);
    revokedPages.revoke();
    const resolverProxy = new Proxy(() => ({ kind: 'page', key: 'ready' }), {
      apply() {
        proxyTraps++;
        throw new Error('resolver proxy apply trap');
      },
      getPrototypeOf() {
        proxyTraps++;
        throw new Error('resolver proxy prototype trap');
      },
    });

    const cases = [
      pagesAccessor,
      resolveAccessor,
      { pages: indexAccessor, resolve: () => ({ kind: 'page', key: 'ready' }) },
      { pages: [keyAccessor], resolve: () => ({ kind: 'page', key: 'ready' }) },
      { pages: [bytesAccessor], resolve: () => ({ kind: 'page', key: 'ready' }) },
      {
        pages: new Proxy([{ key: 'ready', bytes: PAGE }], handler),
        resolve: () => ({ kind: 'page', key: 'ready' }),
      },
      { pages: revokedPages.proxy, resolve: () => ({ kind: 'page', key: 'ready' }) },
      {
        pages: [new Proxy({ key: 'ready', bytes: PAGE }, handler)],
        resolve: () => ({ kind: 'page', key: 'ready' }),
      },
      {
        pages: [{ key: 'ready', bytes: new Proxy(PAGE.slice(), handler) }],
        resolve: () => ({ kind: 'page', key: 'ready' }),
      },
      { pages: [{ key: 'ready', bytes: PAGE }], resolve: resolverProxy },
    ];
    for (const input of cases) {
      const error = await catchError(() => startWith(input));
      expect(error?.message).to.eql('BootstrapStatus.start invalid input.');
    }
    expect({ accessorCalls, proxyTraps }).to.eql({ accessorCalls: 0, proxyTraps: 0 });
  });
});
