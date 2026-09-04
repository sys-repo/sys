import { describe, expect, Hash, Is, it, Rx, StdPath } from '../../-test.ts';
import { Fs } from '../common.ts';
import { readLocalPartWithIo, readPinnedPartWithIo } from '../u.verify/u.pinned.part.ts';
import type { VerifyIo } from '../u.verify/u.pinned.io.ts';
import { verifyLocalWithIo, verifyPinnedWithIo } from '../u.verify/u.pinned.ts';
import {
  type Fixture,
  fixturePart,
  type IoCall,
  limits,
  setup,
  traceIo,
} from './-u.pinned.fixture.ts';

type Operation = Readonly<{
  name: string;
  success: 'read' | 'verified';
  input: Readonly<Record<string, unknown>>;
  run(input: unknown, io: VerifyIo): Promise<Readonly<{ kind: string }>>;
}>;

type Counter = { current: number };

const checksum = Hash.sha256('admission-test');
const operations = [
  {
    name: 'Local.verify',
    success: 'verified',
    input: { dir: '/unused', limits },
    run: verifyLocalWithIo,
  },
  {
    name: 'Pinned.verify',
    success: 'verified',
    input: { dir: '/unused', integrity: checksum, limits },
    run: verifyPinnedWithIo,
  },
  {
    name: 'Local.readPart',
    success: 'read',
    input: { dir: '/unused', path: 'index.html', checksum, size: 0 },
    run: readLocalPartWithIo,
  },
  {
    name: 'Pinned.readPart',
    success: 'read',
    input: { dir: '/unused', path: 'index.html', checksum, size: 0 },
    run: readPinnedPartWithIo,
  },
] satisfies readonly Operation[];

describe('Pkg.Dist checked-input admission', () => {
  it('retains valid lifecycle handles without widening filesystem authority', async () => {
    const life = Rx.lifecycle();
    life.dispose();
    const { calls, io } = forbiddenIo();

    for (const operation of operations) {
      const result = await operation.run({ ...operation.input, until: [life] }, io);
      expect(result, operation.name).to.eql({ kind: 'cancelled' });
    }
    expect(calls).to.eql([]);
  });

  it('owns lifecycle arrays before validating getter-bearing leaves', async () => {
    const { calls, io } = forbiddenIo();

    for (const operation of operations) {
      const slotGetters: Counter = { current: 0 };
      const handleGetters: Counter = { current: 0 };
      const fixture = mutatingLifecycleArray(slotGetters, handleGetters);
      try {
        const result = await operation.run(
          { ...operation.input, until: fixture.until },
          io,
        );
        expect(result, operation.name).to.eql({ kind: 'cancelled' });
        expect(slotGetters.current, operation.name).to.eql(0);
        expect(handleGetters.current, operation.name).to.be.greaterThan(0);
      } finally {
        fixture.life.dispose();
      }
    }

    expect(calls).to.eql([]);
  });

  it('rejects accessors and Proxies without invoking caller code or filesystem IO', async () => {
    const getters: Counter = { current: 0 };
    const traps: Counter = { current: 0 };
    const { calls, io } = forbiddenIo();

    for (const operation of operations) {
      for (const candidate of invalidInputs(operation.input, getters, traps)) {
        const result = await operation.run(candidate.input, io);
        expect(result, `${operation.name}: ${candidate.name}`).to.eql({ kind: 'invalid-input' });
      }
    }

    expect(getters.current).to.eql(0);
    expect(traps.current).to.eql(0);
    expect(calls).to.eql([]);
  });

  it('captures each relative root before yielding and resolves later calls independently', async () => {
    const originalCwd = Fs.cwd();
    const parentA = await Deno.makeTempDir({ prefix: 'Pkg.Dist.cwd.A.' });
    const parentB = await Deno.makeTempDir({ prefix: 'Pkg.Dist.cwd.B.' });

    try {
      const fixtureA = await setup(StdPath.join(parentA, 'dist'));
      const fixtureB = await setup(StdPath.join(parentB, 'dist'));
      const operationsA = fixtureOperations(fixtureA);
      const operationsB = fixtureOperations(fixtureB);

      for (let index = 0; index < operationsA.length; index++) {
        const operationA = operationsA[index];
        const operationB = operationsB[index];
        if (!operationA || !operationB) throw new Error('Expected paired operations.');

        Deno.chdir(parentA);
        const callsA: IoCall[] = [];
        const lifecycle = cwdChangingLifecycle(parentB);
        const pendingA = operationA.run(
          { ...operationA.input, until: lifecycle.until },
          traceIo(callsA),
        );
        Deno.chdir(parentB);
        const resultA = await pendingA.finally(() => lifecycle.life.dispose());

        expect(resultA.kind, operationA.name).to.eql(operationA.success);
        expect(observedPath(callsA, fixtureA.dir), operationA.name).to.eql(true);
        expect(observedWithin(callsA, fixtureB.dir), operationA.name).to.eql(false);

        const callsB: IoCall[] = [];
        const resultB = await operationB.run(operationB.input, traceIo(callsB));
        expect(resultB.kind, operationB.name).to.eql(operationB.success);
        expect(observedPath(callsB, fixtureB.dir), operationB.name).to.eql(true);
        expect(observedWithin(callsB, fixtureA.dir), operationB.name).to.eql(false);
      }
    } finally {
      Deno.chdir(originalCwd);
      await Deno.remove(parentA, { recursive: true }).catch(() => undefined);
      await Deno.remove(parentB, { recursive: true }).catch(() => undefined);
    }
  });
});

/**
 * Helpers:
 */
function invalidInputs(
  valid: Readonly<Record<string, unknown>>,
  getters: Counter,
  traps: Counter,
) {
  const untilProxy = hostileProxy(new AbortController().signal, traps);
  const untilAccessor: unknown[] = [];
  Object.defineProperty(untilAccessor, '0', {
    enumerable: true,
    get() {
      getters.current += 1;
      return new AbortController().signal;
    },
  });
  const proxyPrototypeUntil = withPrototype(
    [new AbortController().signal],
    hostileProxy(Array.prototype, traps),
  );
  const revokedPrototypeUntil = withPrototype(
    [new AbortController().signal],
    revokedProxy(Array.prototype),
  );
  const nonstandardPrototypeUntil = withPrototype([new AbortController().signal], null);
  const proxyPrototypeLeaf = Object.create(hostileProxy({}, traps));
  const revokedPrototypeLeaf = Object.create(revokedProxy({}));

  const inputs: Array<Readonly<{ name: string; input: unknown }>> = [
    { name: 'top-level accessor', input: accessor(valid, 'dir', getters) },
    { name: 'top-level Proxy', input: hostileProxy(valid, traps) },
    { name: 'top-level revoked Proxy', input: revokedProxy(valid) },
    { name: 'lifecycle Proxy', input: { ...valid, until: untilProxy } },
    { name: 'lifecycle accessor array', input: { ...valid, until: untilAccessor } },
    { name: 'lifecycle Proxy prototype', input: { ...valid, until: proxyPrototypeUntil } },
    {
      name: 'lifecycle revoked Proxy prototype',
      input: { ...valid, until: revokedPrototypeUntil },
    },
    {
      name: 'lifecycle nonstandard array prototype',
      input: { ...valid, until: nonstandardPrototypeUntil },
    },
    { name: 'lifecycle leaf Proxy prototype', input: { ...valid, until: proxyPrototypeLeaf } },
    {
      name: 'lifecycle leaf revoked Proxy prototype',
      input: { ...valid, until: revokedPrototypeLeaf },
    },
    { name: 'nested lifecycle Proxy', input: { ...valid, until: [untilProxy] } },
  ];

  const nestedLimits = valid.limits;
  if (Is.record(nestedLimits)) {
    const values = nestedLimits;
    inputs.push(
      {
        name: 'limits accessor',
        input: { ...valid, limits: accessor(values, 'entries', getters) },
      },
      {
        name: 'limits Proxy',
        input: { ...valid, limits: hostileProxy(values, traps) },
      },
      {
        name: 'limits revoked Proxy',
        input: { ...valid, limits: revokedProxy(values) },
      },
    );
  }

  return inputs;
}

function cwdChangingLifecycle(cwd: string) {
  const life = Rx.lifecycle();
  const until = {
    get disposed() {
      Deno.chdir(cwd);
      return false;
    },
    get dispose$() {
      Deno.chdir(cwd);
      return life.dispose$;
    },
  };
  return { life, until };
}

function fixtureOperations(fixture: Fixture): readonly Operation[] {
  const part = fixturePart(fixture, 'assets/app.js');
  const dir = 'dist';
  return [
    {
      name: 'Local.verify',
      success: 'verified',
      input: { dir, limits },
      run: verifyLocalWithIo,
    },
    {
      name: 'Pinned.verify',
      success: 'verified',
      input: { dir, integrity: fixture.integrity, limits },
      run: verifyPinnedWithIo,
    },
    {
      name: 'Local.readPart',
      success: 'read',
      input: { ...part, dir },
      run: readLocalPartWithIo,
    },
    {
      name: 'Pinned.readPart',
      success: 'read',
      input: { ...part, dir },
      run: readPinnedPartWithIo,
    },
  ];
}

function mutatingLifecycleArray(slotGetters: Counter, handleGetters: Counter) {
  const life = Rx.lifecycle();
  const signal = new AbortController().signal;
  const until: unknown[] = [signal];
  until.push({
    get disposed() {
      handleGetters.current += 1;
      Object.defineProperty(until, '0', {
        configurable: true,
        enumerable: true,
        get() {
          slotGetters.current += 1;
          return signal;
        },
      });
      return true;
    },
    get dispose$() {
      handleGetters.current += 1;
      return life.dispose$;
    },
  });
  return { life, until };
}

function observedPath(calls: readonly IoCall[], path: string): boolean {
  return calls.some((call) => call.path === path);
}

function observedWithin(calls: readonly IoCall[], root: string): boolean {
  return calls.some((call) => StdPath.Is.within(root, call.path));
}

function withPrototype<T extends unknown[]>(input: T, prototype: object | null): T {
  Object.setPrototypeOf(input, prototype);
  return input;
}

function accessor(
  input: Readonly<Record<string, unknown>>,
  key: string,
  calls: Counter,
): object {
  const value = input[key];
  const result = { ...input };
  delete result[key];
  return Object.defineProperty(result, key, {
    enumerable: true,
    get() {
      calls.current += 1;
      return value;
    },
  });
}

function hostileProxy<T extends object>(input: T, calls: Counter): T {
  const trapped = (): never => {
    calls.current += 1;
    throw new Error('Proxy trap invoked.');
  };
  return new Proxy(input, {
    get: trapped,
    getOwnPropertyDescriptor: trapped,
    getPrototypeOf: trapped,
    ownKeys: trapped,
  });
}

function revokedProxy<T extends object>(input: T): T {
  const revoked = Proxy.revocable(input, {});
  revoked.revoke();
  return revoked.proxy;
}

function forbiddenIo(): { readonly calls: string[]; readonly io: VerifyIo } {
  const calls: string[] = [];
  const reject = (operation: string): Promise<never> => {
    calls.push(operation);
    return Promise.reject(new Error(`Unexpected filesystem operation: ${operation}`));
  };
  return {
    calls,
    io: Object.freeze({
      lstat: () => reject('lstat'),
      open: () => reject('open'),
      readDir: () => {
        calls.push('readDir');
        throw new Error('Unexpected filesystem operation: readDir');
      },
      realPath: () => reject('realPath'),
    }),
  };
}
