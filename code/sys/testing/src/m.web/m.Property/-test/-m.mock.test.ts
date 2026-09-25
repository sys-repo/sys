import { describe, expect, it, type t } from '../../../-test.ts';
import { WebFixture } from '../../mod.ts';

describe('WebFixture.Property.mock', () => {
  describe('descriptor transaction', () => {
    it('partial replacement → preserves omitted attributes and restores exactly', () => {
      const target = {};
      const original: PropertyDescriptor = {
        configurable: true,
        enumerable: true,
        writable: false,
        value: 'original',
      };
      Object.defineProperty(target, 'value', original);

      const mock = WebFixture.Property.mock([
        {
          target,
          key: 'value',
          descriptor: { configurable: true, value: 'replacement' },
        },
      ]);

      expect(Object.getOwnPropertyDescriptor(target, 'value')).to.eql({
        configurable: true,
        enumerable: true,
        writable: false,
        value: 'replacement',
      });

      mock.dispose();
      mock.dispose();
      expect(Object.getOwnPropertyDescriptor(target, 'value')).to.eql(original);
    });

    it('symbol accessor → installs exactly and restores prior absence', () => {
      const target = {};
      const key = Symbol('value');
      const get = () => 'fixture';
      const set = (_value: string) => undefined;
      const descriptor: PropertyDescriptor = {
        configurable: true,
        enumerable: true,
        get,
        set,
      };

      const mock = WebFixture.Property.mock([{ target, key, descriptor }]);
      expect(Object.getOwnPropertyDescriptor(target, key)).to.eql(descriptor);

      mock.dispose();
      expect(Object.getOwnPropertyDescriptor(target, key)).to.eql(undefined);
    });

    it('using declaration → restores through the canonical disposal operation', () => {
      const target = {};

      {
        using mock = WebFixture.Property.mock([
          {
            target,
            key: 'value',
            descriptor: { configurable: true, value: 'replacement' },
          },
        ]);
        expect(mock[Symbol.dispose]).to.equal(mock.dispose);
        expect(Object.getOwnPropertyDescriptor(target, 'value')?.value).to.eql('replacement');
      }

      expect(Object.getOwnPropertyDescriptor(target, 'value')).to.eql(undefined);
    });

    it('absent property → rejects an irreversible non-configurable replacement', () => {
      const target = {};
      const failure = captureFailure(() =>
        WebFixture.Property.mock([{ target, key: 'value', descriptor: { value: 'fixture' } }])
      );

      expect(failure).to.be.instanceof(TypeError);
      expect(failure).to.have.property('message', 'Irreversible property fixture entry: value');
      expect((failure as Error).cause).to.be.instanceof(TypeError);
      expect(Object.getOwnPropertyDescriptor(target, 'value')).to.eql(undefined);
    });

    it('configurable property → rejects an irreversible configurability downgrade', () => {
      const target = {};
      const original = { configurable: true, value: 'original' };
      Object.defineProperty(target, 'value', original);

      const failure = captureFailure(() =>
        WebFixture.Property.mock([
          { target, key: 'value', descriptor: { configurable: false, value: 'fixture' } },
        ])
      );

      expect(failure).to.be.instanceof(TypeError);
      expect(Object.getOwnPropertyDescriptor(target, 'value')).to.eql({
        configurable: true,
        enumerable: false,
        writable: false,
        value: 'original',
      });
    });

    it('writable property → rejects an irreversible writability downgrade', () => {
      const target = {};
      const original = {
        configurable: false,
        enumerable: true,
        writable: true,
        value: 'original',
      };
      Object.defineProperty(target, 'value', original);

      const failure = captureFailure(() =>
        WebFixture.Property.mock([
          { target, key: 'value', descriptor: { writable: false, value: 'fixture' } },
        ])
      );

      expect(failure).to.be.instanceof(TypeError);
      expect(Object.getOwnPropertyDescriptor(target, 'value')).to.eql(original);
    });
  });

  describe('input admission', () => {
    it('entry authority → reads target, key, and descriptor once', () => {
      const target = {};
      const descriptor = { configurable: true, value: 'replacement' };
      let targetReads = 0;
      let keyReads = 0;
      let descriptorReads = 0;
      const entry = Object.defineProperties({}, {
        target: {
          get() {
            targetReads += 1;
            return target;
          },
        },
        key: {
          get() {
            keyReads += 1;
            return 'value';
          },
        },
        descriptor: {
          get() {
            descriptorReads += 1;
            return descriptor;
          },
        },
      }) as t.WebFixture.Property.Entry;

      const mock = WebFixture.Property.mock([entry]);
      expect({ targetReads, keyReads, descriptorReads }).to.eql({
        targetReads: 1,
        keyReads: 1,
        descriptorReads: 1,
      });
      expect(Object.getOwnPropertyDescriptor(target, 'value')?.value).to.eql('replacement');

      mock.dispose();
    });

    it('entry authority → cannot redirect internal array slots through a prototype setter', () => {
      const nativeDefineProperty = Object.defineProperty;
      const nativeDeleteProperty = Reflect.deleteProperty;
      const slotDescriptor = Object.getOwnPropertyDescriptor(Array.prototype, '0');
      const target = {};
      const entry = Object.defineProperties({}, {
        target: {
          get() {
            nativeDefineProperty(Array.prototype, '0', {
              configurable: true,
              set: (_value: unknown) => undefined,
            });
            return target;
          },
        },
        key: { value: 'value' },
        descriptor: { value: { configurable: true, value: 'replacement' } },
      }) as t.WebFixture.Property.Entry;
      let installed: PropertyDescriptor | undefined;
      let mock: t.WebFixture.Property.Mock | undefined;

      try {
        mock = WebFixture.Property.mock([entry]);
        installed = Object.getOwnPropertyDescriptor(target, 'value');
      } finally {
        try {
          if (slotDescriptor !== undefined) {
            nativeDefineProperty(Array.prototype, '0', slotDescriptor);
          } else if (!nativeDeleteProperty(Array.prototype, '0')) {
            throw new TypeError('Failed to restore Array.prototype after a test.');
          }
        } finally {
          mock?.dispose();
        }
      }

      expect(installed?.value).to.eql('replacement');
      expect(Object.getOwnPropertyDescriptor(target, 'value')).to.eql(undefined);
    });

    it('descriptor authority → reads each admitted field once', () => {
      const target = {};
      const reads = { configurable: 0, enumerable: 0, value: 0, writable: 0 };
      const descriptor = Object.defineProperties(Object.create(null), {
        configurable: {
          get() {
            reads.configurable += 1;
            return true;
          },
        },
        enumerable: {
          get() {
            reads.enumerable += 1;
            return true;
          },
        },
        value: {
          get() {
            reads.value += 1;
            return 'replacement';
          },
        },
        writable: {
          get() {
            reads.writable += 1;
            return false;
          },
        },
      }) as PropertyDescriptor;

      const mock = WebFixture.Property.mock([{ target, key: 'value', descriptor }]);
      expect(reads).to.eql({ configurable: 1, enumerable: 1, value: 1, writable: 1 });
      expect(Object.getOwnPropertyDescriptor(target, 'value')).to.eql({
        configurable: true,
        enumerable: true,
        writable: false,
        value: 'replacement',
      });

      mock.dispose();
    });

    it('inherited descriptor fields → follow standard presence and read order', () => {
      const target = {};
      const trace: string[] = [];
      const fields = ['enumerable', 'configurable', 'value', 'writable', 'get', 'set'];
      const descriptor = new Proxy(
        Object.create({
          configurable: true,
          enumerable: true,
          value: 'replacement',
          writable: false,
        }),
        {
          has(current, key) {
            if (typeof key === 'string' && fields.includes(key)) trace.push(`has:${key}`);
            return Reflect.has(current, key);
          },
          get(current, key, receiver) {
            if (typeof key === 'string' && fields.includes(key)) trace.push(`get:${key}`);
            return Reflect.get(current, key, receiver);
          },
        },
      ) as PropertyDescriptor;

      const mock = WebFixture.Property.mock([{ target, key: 'value', descriptor }]);

      expect(trace).to.eql([
        'has:enumerable',
        'get:enumerable',
        'has:configurable',
        'get:configurable',
        'has:value',
        'get:value',
        'has:writable',
        'get:writable',
        'has:get',
        'has:set',
      ]);
      expect(Object.getOwnPropertyDescriptor(target, 'value')).to.eql({
        configurable: true,
        enumerable: true,
        writable: false,
        value: 'replacement',
      });

      mock.dispose();
    });

    it('mixed descriptor → reads every field in order before rejecting its shape', () => {
      const fields = ['enumerable', 'configurable', 'value', 'writable', 'get', 'set'];
      const trace: string[] = [];
      const descriptor = new Proxy(
        {
          configurable: true,
          enumerable: true,
          value: 'data',
          writable: true,
          get: () => 'accessor',
          set: (_value: unknown) => undefined,
        },
        {
          has(current, key) {
            if (typeof key === 'string' && fields.includes(key)) trace.push(`has:${key}`);
            return Reflect.has(current, key);
          },
          get(current, key, receiver) {
            if (typeof key === 'string' && fields.includes(key)) trace.push(`get:${key}`);
            return Reflect.get(current, key, receiver);
          },
        },
      );

      const failure = captureFailure(() =>
        WebFixture.Property.mock([{ target: {}, key: 'value', descriptor }])
      );

      expect(failure).to.be.instanceof(TypeError);
      expect(trace).to.eql([
        'has:enumerable',
        'get:enumerable',
        'has:configurable',
        'get:configurable',
        'has:value',
        'get:value',
        'has:writable',
        'get:writable',
        'has:get',
        'get:get',
        'has:set',
        'get:set',
      ]);
    });

    it('descriptor field failure → preserves caller failure identity', () => {
      const authorityFailure = new Error('descriptor-authority-failure');
      const descriptor = Object.defineProperty(Object.create(null), 'enumerable', {
        get() {
          throw authorityFailure;
        },
      }) as PropertyDescriptor;

      const failure = captureFailure(() =>
        WebFixture.Property.mock([{ target: {}, key: 'value', descriptor }])
      );

      expect(failure).to.equal(authorityFailure);
    });

    it('invalid getter → fails before reading setter authority', () => {
      const setterFailure = new Error('setter-authority-read');
      let setterReads = 0;
      const descriptor = Object.defineProperties(Object.create(null), {
        get: { value: 'not-callable' },
        set: {
          get() {
            setterReads += 1;
            throw setterFailure;
          },
        },
      }) as PropertyDescriptor;

      const failure = captureFailure(() =>
        WebFixture.Property.mock([{ target: {}, key: 'value', descriptor }])
      );

      expect(failure).to.be.instanceof(TypeError);
      expect(failure).to.not.equal(setterFailure);
      expect(setterReads).to.eql(0);
    });

    it('invalid descriptor → fails before mutating any supplied target', () => {
      const backing = {};
      let mutations = 0;
      const target = new Proxy(backing, {
        defineProperty(current, key, descriptor) {
          mutations += 1;
          return Reflect.defineProperty(current, key, descriptor);
        },
      });

      const failure = captureFailure(() =>
        WebFixture.Property.mock([
          {
            target,
            key: 'first',
            descriptor: { configurable: true, value: 'replacement' },
          },
          {
            target: {},
            key: 'invalid',
            descriptor: { get: () => 'accessor', value: 'data' },
          },
        ])
      );

      expect(failure).to.be.instanceof(TypeError);
      expect(mutations).to.eql(0);
      expect(Object.getOwnPropertyDescriptor(backing, 'first')).to.eql(undefined);
    });

    it('irreversible later entry → rejects before mutating an earlier supplied target', () => {
      const backing = {};
      let mutations = 0;
      const target = new Proxy(backing, {
        defineProperty(current, key, descriptor) {
          mutations += 1;
          return Reflect.defineProperty(current, key, descriptor);
        },
      });

      const failure = captureFailure(() =>
        WebFixture.Property.mock([
          {
            target,
            key: 'first',
            descriptor: { configurable: true, value: 'replacement' },
          },
          { target: {}, key: 'second', descriptor: { value: 'irreversible' } },
        ])
      );

      expect(failure).to.be.instanceof(TypeError);
      expect(mutations).to.eql(0);
      expect(Object.getOwnPropertyDescriptor(backing, 'first')).to.eql(undefined);
    });

    it('duplicate target and key → rejects before descriptor evaluation', () => {
      const target = {};
      let descriptorReads = 0;
      const entry = {
        target,
        key: 'value',
        get descriptor() {
          descriptorReads += 1;
          return { configurable: true, value: 'replacement' };
        },
      };

      const failure = captureFailure(() => WebFixture.Property.mock([entry, entry]));

      expect(failure).to.be.instanceof(TypeError);
      expect(failure).to.have.property('message', 'Duplicate property fixture entry: value');
      expect(descriptorReads).to.eql(0);
      expect(Object.getOwnPropertyDescriptor(target, 'value')).to.eql(undefined);
    });

    it('numeric and string key aliases → reject as one property before descriptor evaluation', () => {
      const target = {};
      let descriptorReads = 0;
      const descriptor = () => {
        descriptorReads += 1;
        return { configurable: true, value: 'replacement' };
      };
      const numeric = {
        target,
        key: 1,
        get descriptor() {
          return descriptor();
        },
      };
      const string = {
        target,
        key: '1',
        get descriptor() {
          return descriptor();
        },
      };

      const failure = captureFailure(() => WebFixture.Property.mock([numeric, string]));

      expect(failure).to.be.instanceof(TypeError);
      expect(failure).to.have.property('message', 'Duplicate property fixture entry: 1');
      expect(descriptorReads).to.eql(0);
      expect(Object.getOwnPropertyDescriptor(target, '1')).to.eql(undefined);
    });

    it('descriptor authority → cannot redirect neutral validation through Object.create', () => {
      const createDescriptor = Object.getOwnPropertyDescriptor(Object, 'create')!;
      const nativeDefineProperty = Object.defineProperty;
      const victim = {};
      const descriptor = Object.defineProperties(Object.create(null), {
        enumerable: {
          get() {
            Object.create = ((_prototype: object | null) => victim) as typeof Object.create;
            return true;
          },
        },
        get: { value: 'not-callable' },
      }) as PropertyDescriptor;
      let failure: unknown;

      try {
        failure = captureFailure(() =>
          WebFixture.Property.mock([{ target: victim, key: 'value', descriptor }])
        );
      } finally {
        nativeDefineProperty(Object, 'create', createDescriptor);
      }

      expect(failure).to.be.instanceof(TypeError);
      expect(Object.getOwnPropertyDescriptor(victim, 'get')).to.eql(undefined);
      expect(Object.getOwnPropertyDescriptor(victim, 'descriptor')).to.eql(undefined);
      expect(Object.getOwnPropertyDescriptor(victim, 'value')).to.eql(undefined);
    });

    it('descriptor authority → cannot replace array admission mechanics', () => {
      const nativeDefineProperty = Object.defineProperty;
      const mapDescriptor = Object.getOwnPropertyDescriptor(Array.prototype, 'map')!;
      const iteratorDescriptor = Object.getOwnPropertyDescriptor(
        Array.prototype,
        Symbol.iterator,
      )!;
      const target = {};
      const descriptor = Object.defineProperties(Object.create(null), {
        configurable: {
          get() {
            nativeDefineProperty(Array.prototype, 'map', {
              ...mapDescriptor,
              value: () => [],
            });
            nativeDefineProperty(Array.prototype, Symbol.iterator, {
              ...iteratorDescriptor,
              value: () => ({ next: () => ({ done: true, value: undefined }) }),
            });
            return true;
          },
        },
        value: { value: 'replacement' },
      }) as PropertyDescriptor;
      let installed: PropertyDescriptor | undefined;
      let mock: t.WebFixture.Property.Mock | undefined;

      try {
        mock = WebFixture.Property.mock([{ target, key: 'value', descriptor }]);
        installed = Object.getOwnPropertyDescriptor(target, 'value');
      } finally {
        nativeDefineProperty(Array.prototype, 'map', mapDescriptor);
        nativeDefineProperty(Array.prototype, Symbol.iterator, iteratorDescriptor);
        mock?.dispose();
      }

      expect(installed?.value).to.eql('replacement');
      expect(Object.getOwnPropertyDescriptor(target, 'value')).to.eql(undefined);
    });

    it('descriptor authority → cannot pollute internal descriptor records', () => {
      const nativeDefineProperty = Object.defineProperty;
      const nativeDeleteProperty = Reflect.deleteProperty;
      const ambientGet = Object.getOwnPropertyDescriptor(Object.prototype, 'get');
      const target = {};
      const original = { configurable: true, value: 'original' };
      nativeDefineProperty(target, 'value', original);
      const descriptor = Object.defineProperties(Object.create(null), {
        configurable: {
          get() {
            const poison = Object.create(null) as PropertyDescriptor;
            poison.configurable = true;
            poison.get = () => undefined;
            nativeDefineProperty(Object.prototype, 'get', poison);
            return true;
          },
        },
        value: { value: 'replacement' },
      }) as PropertyDescriptor;
      let failure: unknown;
      let installed: PropertyDescriptor | undefined;
      let restored: PropertyDescriptor | undefined;

      try {
        try {
          const mock = WebFixture.Property.mock([{ target, key: 'value', descriptor }]);
          installed = Object.getOwnPropertyDescriptor(target, 'value');
          mock.dispose();
        } catch (error) {
          failure = error;
        }
      } finally {
        nativeDeleteProperty(Object.prototype, 'get');
        if (ambientGet !== undefined) {
          nativeDefineProperty(Object.prototype, 'get', ambientGet);
        }
        restored = Object.getOwnPropertyDescriptor(target, 'value');
        nativeDefineProperty(target, 'value', original);
      }

      expect(failure).to.eql(undefined);
      expect(installed?.value).to.eql('replacement');
      expect(restored).to.eql({
        configurable: true,
        enumerable: false,
        writable: false,
        value: 'original',
      });
    });
  });

  describe('setup rollback', () => {
    it('successful no-op installation → rejects false setup success', () => {
      const backing = {};
      Object.defineProperty(backing, 'value', { configurable: true, value: 'original' });
      const target = new Proxy(backing, {
        defineProperty(current, key, descriptor) {
          if (descriptor.value === 'replacement') return true;
          return Reflect.defineProperty(current, key, descriptor);
        },
      });

      const failure = captureFailure(() =>
        WebFixture.Property.mock([
          { target, key: 'value', descriptor: { configurable: true, value: 'replacement' } },
        ])
      );

      expect(failure).to.be.instanceof(TypeError);
      expect(failure).to.have.property(
        'message',
        'Property fixture installation did not produce the expected descriptor: value',
      );
      expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('original');
    });

    it('failed setup mutation → observation cannot discard rollback authority', () => {
      const backing = {};
      const original = { configurable: true, value: 'original' };
      Object.defineProperty(backing, 'value', original);
      const setupFailure = new Error('setup-failure');
      const rollbackFailure = new Error('rollback-failure');
      let blockRollback = true;
      let rollingBack = false;
      let lieOnce = true;
      const target = new Proxy(backing, {
        defineProperty(current, key, descriptor) {
          if (descriptor.value === 'replacement') {
            Reflect.defineProperty(current, key, descriptor);
            rollingBack = true;
            throw setupFailure;
          }
          if (descriptor.value === 'original' && blockRollback) throw rollbackFailure;
          return Reflect.defineProperty(current, key, descriptor);
        },
        getOwnPropertyDescriptor(current, key) {
          if (rollingBack && lieOnce) {
            lieOnce = false;
            return { configurable: true, enumerable: false, writable: false, value: 'original' };
          }
          return Reflect.getOwnPropertyDescriptor(current, key);
        },
      });

      try {
        const failure = captureFailure(() =>
          WebFixture.Property.mock([
            { target, key: 'value', descriptor: { configurable: true, value: 'replacement' } },
          ])
        );

        const cleanup = expectCleanupError(failure, 'setup');
        expect(cleanup.errors).to.eql([setupFailure, rollbackFailure]);
        expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('replacement');

        blockRollback = false;
        cleanup.rollback.dispose();
        expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('original');
      } finally {
        blockRollback = false;
        Object.defineProperty(backing, 'value', original);
      }
    });

    it('installation failure → restores every active replacement', () => {
      const backing = {};
      Object.defineProperty(backing, 'first', { configurable: true, value: 'original' });
      const setupFailure = new Error('setup-failure');
      const target = new Proxy(backing, {
        defineProperty(current, key, descriptor) {
          if (key === 'second' && descriptor.value === 'mock-second') throw setupFailure;
          return Reflect.defineProperty(current, key, descriptor);
        },
      });

      const failure = captureFailure(() =>
        WebFixture.Property.mock([
          { target, key: 'first', descriptor: { configurable: true, value: 'mock-first' } },
          { target, key: 'second', descriptor: { configurable: true, value: 'mock-second' } },
        ])
      );

      expect(failure).to.equal(setupFailure);
      expect(Object.getOwnPropertyDescriptor(backing, 'first')?.value).to.eql('original');
      expect(Object.getOwnPropertyDescriptor(backing, 'second')).to.eql(undefined);
    });

    it('uncertain installation → requires one successful restoration', () => {
      const backing = {};
      Object.defineProperty(backing, 'value', { configurable: true, value: 'original' });
      const setupFailure = new Error('setup-failure');
      const rollbackFailure = new Error('rollback-failure');
      let blockRollback = true;
      const target = new Proxy(backing, {
        defineProperty(current, key, descriptor) {
          if (descriptor.value === 'replacement') throw setupFailure;
          if (descriptor.value === 'original' && blockRollback) throw rollbackFailure;
          return Reflect.defineProperty(current, key, descriptor);
        },
      });

      const failure = captureFailure(() =>
        WebFixture.Property.mock([
          { target, key: 'value', descriptor: { configurable: true, value: 'replacement' } },
        ])
      );

      const cleanup = expectCleanupError(failure, 'setup');
      expect(cleanup.errors).to.eql([setupFailure, rollbackFailure]);
      expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('original');

      blockRollback = false;
      cleanup.rollback.dispose();
    });

    it('mutated-then-thrown entry → retains rollback authority when restoration is blocked', () => {
      const backing = {};
      Object.defineProperty(backing, 'value', { configurable: true, value: 'original' });
      const setupFailure = new Error('setup-failure');
      const rollbackFailure = new Error('rollback-failure');
      let blockRollback = true;
      const target = new Proxy(backing, {
        defineProperty(current, key, descriptor) {
          if (descriptor.value === 'replacement') {
            Reflect.defineProperty(current, key, descriptor);
            throw setupFailure;
          }
          if (descriptor.value === 'original' && blockRollback) throw rollbackFailure;
          return Reflect.defineProperty(current, key, descriptor);
        },
      });

      const failure = captureFailure(() =>
        WebFixture.Property.mock([
          { target, key: 'value', descriptor: { configurable: true, value: 'replacement' } },
        ])
      );

      const cleanup = expectCleanupError(failure, 'setup');
      expect(cleanup.errors).to.eql([setupFailure, rollbackFailure]);
      expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('replacement');

      blockRollback = false;
      cleanup.rollback.dispose();
      expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('original');
    });

    it('ambient array iterator → cannot alter setup-error aggregation', () => {
      const nativeDefineProperty = Object.defineProperty;
      const iteratorDescriptor = Object.getOwnPropertyDescriptor(
        Array.prototype,
        Symbol.iterator,
      )!;
      const backing = {};
      Object.defineProperty(backing, 'value', { configurable: true, value: 'original' });
      const setupFailure = new Error('setup-failure');
      const rollbackFailure = new Error('rollback-failure');
      let blockRollback = true;
      const target = new Proxy(backing, {
        defineProperty(current, key, descriptor) {
          if (descriptor.value === 'replacement') {
            Reflect.defineProperty(current, key, descriptor);
            throw setupFailure;
          }
          if (descriptor.value === 'original' && blockRollback) throw rollbackFailure;
          return Reflect.defineProperty(current, key, descriptor);
        },
      });
      const descriptor = Object.defineProperties(Object.create(null), {
        configurable: {
          get() {
            nativeDefineProperty(Array.prototype, Symbol.iterator, {
              ...iteratorDescriptor,
              value: () => ({ next: () => ({ done: true, value: undefined }) }),
            });
            return true;
          },
        },
        value: { value: 'replacement' },
      }) as PropertyDescriptor;
      let failure: unknown;

      try {
        failure = captureFailure(() =>
          WebFixture.Property.mock([{ target, key: 'value', descriptor }])
        );
      } finally {
        nativeDefineProperty(Array.prototype, Symbol.iterator, iteratorDescriptor);
      }

      const cleanup = expectCleanupError(failure, 'setup');
      expect(cleanup.errors).to.eql([setupFailure, rollbackFailure]);

      blockRollback = false;
      cleanup.rollback.dispose();
      expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('original');
    });

    it('cleanup constructor authority → cannot be redirected during admission', () => {
      const nativeGetPrototypeOf = Object.getPrototypeOf;
      const nativeSetPrototypeOf = Object.setPrototypeOf;
      const seedBacking = {};
      let seedBlocked = true;
      const seedTarget = new Proxy(seedBacking, {
        deleteProperty(current, key) {
          return seedBlocked ? false : Reflect.deleteProperty(current, key);
        },
      });
      const seedMock = WebFixture.Property.mock([
        {
          target: seedTarget,
          key: 'value',
          descriptor: { configurable: true, value: 'seed' },
        },
      ]);
      const seed = expectCleanupError(captureFailure(() => seedMock.dispose()), 'restore');
      seedBlocked = false;
      seed.rollback.dispose();

      const exposedConstructor = seed.constructor as new (...args: unknown[]) => unknown;
      const nativeSuper = nativeGetPrototypeOf(exposedConstructor);
      const constructionFailure = new Error('poisoned-cleanup-construction');
      function PoisonConstructor(): never {
        throw constructionFailure;
      }
      const setupFailure = new Error('setup-failure');
      const rollbackFailure = new Error('rollback-failure');
      const descriptor = Object.defineProperties(Object.create(null), {
        configurable: {
          get() {
            nativeSetPrototypeOf(exposedConstructor, PoisonConstructor);
            return true;
          },
        },
        value: { value: 'replacement' },
      }) as PropertyDescriptor;
      const backing = {};
      let blockRollback = true;
      const target = new Proxy(backing, {
        defineProperty(current, key, next) {
          Reflect.defineProperty(current, key, next);
          throw setupFailure;
        },
        deleteProperty(current, key) {
          if (blockRollback) throw rollbackFailure;
          return Reflect.deleteProperty(current, key);
        },
      });
      let failure: unknown;

      try {
        try {
          failure = captureFailure(() =>
            WebFixture.Property.mock([{ target, key: 'value', descriptor }])
          );
        } finally {
          nativeSetPrototypeOf(exposedConstructor, nativeSuper);
        }

        const cleanup = expectCleanupError(failure, 'setup');
        expect(cleanup.errors).to.eql([setupFailure, rollbackFailure]);
        expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('replacement');

        blockRollback = false;
        cleanup.rollback.dispose();
        expect(Object.getOwnPropertyDescriptor(backing, 'value')).to.eql(undefined);
      } finally {
        nativeSetPrototypeOf(exposedConstructor, nativeSuper);
        blockRollback = false;
        Reflect.deleteProperty(backing, 'value');
      }
    });

    it('rollback failure → reports every cause and exposes retry authority', () => {
      const backing = {};
      Object.defineProperty(backing, 'first', { configurable: true, value: 'original' });
      const setupFailure = new Error('setup-failure');
      const rollbackFailure = new Error('rollback-failure');
      let blockRollback = true;
      const target = new Proxy(backing, {
        defineProperty(current, key, descriptor) {
          if (key === 'second' && descriptor.value === 'mock-second') throw setupFailure;
          if (key === 'first' && descriptor.value === 'original' && blockRollback) {
            throw rollbackFailure;
          }
          return Reflect.defineProperty(current, key, descriptor);
        },
      });

      const failure = captureFailure(() =>
        WebFixture.Property.mock([
          { target, key: 'first', descriptor: { configurable: true, value: 'mock-first' } },
          { target, key: 'second', descriptor: { configurable: true, value: 'mock-second' } },
        ])
      );

      const cleanup = expectCleanupError(failure, 'setup');
      expect(cleanup.errors).to.eql([setupFailure, rollbackFailure]);
      expect(Object.isFrozen(cleanup.errors)).to.eql(true);
      const rollback = cleanup.rollback;
      expect(Object.getOwnPropertyDescriptor(cleanup, 'rollback')).to.eql({
        configurable: false,
        enumerable: false,
        writable: false,
        value: rollback,
      });
      expect(rollback[Symbol.dispose]).to.equal(rollback.dispose);
      expect(Object.getOwnPropertyDescriptor(backing, 'first')?.value).to.eql('mock-first');

      blockRollback = false;
      rollback.dispose();
      rollback.dispose();
      expect(Object.getOwnPropertyDescriptor(backing, 'first')?.value).to.eql('original');
    });
  });

  describe('disposal', () => {
    it('successful no-op deletion → retains cleanup authority', () => {
      const backing = {};
      let skipDeletion = true;
      const target = new Proxy(backing, {
        deleteProperty(current, key) {
          if (skipDeletion) return true;
          return Reflect.deleteProperty(current, key);
        },
      });
      const mock = WebFixture.Property.mock([
        { target, key: 'value', descriptor: { configurable: true, value: 'replacement' } },
      ]);

      try {
        const failure = captureFailure(() => mock.dispose());
        const cleanup = expectCleanupError(failure, 'restore');
        expect(cleanup.rollback).to.equal(mock);
        expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('replacement');

        skipDeletion = false;
        cleanup.rollback.dispose();
        expect(Object.getOwnPropertyDescriptor(backing, 'value')).to.eql(undefined);
      } finally {
        skipDeletion = false;
        try {
          mock.dispose();
        } finally {
          Reflect.deleteProperty(backing, 'value');
        }
      }
    });

    it('successful no-op restoration → retains cleanup authority', () => {
      const backing = {};
      Object.defineProperty(backing, 'value', { configurable: true, value: 'original' });
      let skipRestore = true;
      const target = new Proxy(backing, {
        defineProperty(current, key, descriptor) {
          if (descriptor.value === 'original' && skipRestore) return true;
          return Reflect.defineProperty(current, key, descriptor);
        },
      });
      const mock = WebFixture.Property.mock([
        { target, key: 'value', descriptor: { configurable: true, value: 'replacement' } },
      ]);

      const failure = expectCleanupError(captureFailure(() => mock.dispose()), 'restore');
      expect(failure.errors).to.have.length(1);
      expect(failure.errors[0]).to.have.property(
        'message',
        'Property fixture restoration did not produce the prior descriptor: value',
      );
      expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('replacement');

      skipRestore = false;
      failure.rollback.dispose();
      expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('original');
    });

    it('thrown restoration mutation → requires one successful retry', () => {
      const backing = {};
      Object.defineProperty(backing, 'value', { configurable: true, value: 'original' });
      const restoreFailure = new Error('restore-failure');
      let throwAfterRestore = true;
      const target = new Proxy(backing, {
        defineProperty(current, key, descriptor) {
          const result = Reflect.defineProperty(current, key, descriptor);
          if (descriptor.value === 'original' && throwAfterRestore) {
            throwAfterRestore = false;
            throw restoreFailure;
          }
          return result;
        },
      });
      const mock = WebFixture.Property.mock([
        { target, key: 'value', descriptor: { configurable: true, value: 'replacement' } },
      ]);

      const failure = expectCleanupError(captureFailure(() => mock.dispose()), 'restore');
      expect(failure.errors).to.eql([restoreFailure]);
      expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('original');

      failure.rollback.dispose();
      failure.rollback.dispose();
      expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('original');
    });

    it('using cleanup failure → exports retry authority through the thrown error', () => {
      const backing = {};
      const original = { configurable: true, value: 'original' };
      Object.defineProperty(backing, 'value', original);
      const restoreFailure = new Error('restore-failure');
      let blockRestore = true;
      const target = new Proxy(backing, {
        defineProperty(current, key, descriptor) {
          if (descriptor.value === 'original' && blockRestore) throw restoreFailure;
          return Reflect.defineProperty(current, key, descriptor);
        },
      });
      let failure: unknown;

      try {
        try {
          {
            using mock = WebFixture.Property.mock([
              {
                target,
                key: 'value',
                descriptor: { configurable: true, value: 'replacement' },
              },
            ]);
            expect(mock[Symbol.dispose]).to.equal(mock.dispose);
            expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql(
              'replacement',
            );
          }
        } catch (error) {
          failure = error;
        }

        const cleanup = expectCleanupError(failure, 'restore');
        expect(cleanup.errors).to.eql([restoreFailure]);

        blockRestore = false;
        cleanup.rollback.dispose();
        expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('original');
      } finally {
        blockRestore = false;
        Object.defineProperty(backing, 'value', original);
      }
    });

    it('ambient descriptor fields → cannot corrupt exact restoration', () => {
      const nativeDefineProperty = Object.defineProperty;
      const nativeDeleteProperty = Reflect.deleteProperty;
      const fields = ['configurable', 'enumerable', 'value', 'writable', 'get', 'set'] as const;

      for (const field of fields) {
        const ambient = Object.getOwnPropertyDescriptor(Object.prototype, field);
        const target = {};
        const original = { configurable: true, value: 'original' };
        nativeDefineProperty(target, 'value', original);
        let failure: unknown;
        let restored: PropertyDescriptor | undefined;

        try {
          try {
            {
              using mock = WebFixture.Property.mock([
                {
                  target,
                  key: 'value',
                  descriptor: { configurable: true, value: 'replacement' },
                },
              ]);
              expect(mock[Symbol.dispose]).to.equal(mock.dispose);
              const poison = Object.create(null) as PropertyDescriptor;
              poison.configurable = true;
              poison.get = () => undefined;
              nativeDefineProperty(Object.prototype, field, poison);
            }
          } catch (error) {
            failure = error;
          }
        } finally {
          nativeDeleteProperty(Object.prototype, field);
          if (ambient !== undefined) {
            nativeDefineProperty(Object.prototype, field, ambient);
          }
          restored = Object.getOwnPropertyDescriptor(target, 'value');
          nativeDefineProperty(target, 'value', original);
        }

        expect(failure).to.eql(undefined);
        expect(restored).to.eql({
          configurable: true,
          enumerable: false,
          writable: false,
          value: 'original',
        });
      }
    });

    it('ambient descriptor getter → preserves branded retry authority', () => {
      const nativeDefineProperty = Object.defineProperty;
      const nativeDeleteProperty = Reflect.deleteProperty;
      const ambientGet = Object.getOwnPropertyDescriptor(Object.prototype, 'get');
      const backing = {};
      const original = { configurable: true, value: 'original' };
      nativeDefineProperty(backing, 'value', original);
      const restoreFailure = new Error('restore-failure');
      let blockRestore = true;
      const target = new Proxy(backing, {
        defineProperty(current, key, descriptor) {
          if (descriptor.value === 'original' && blockRestore) throw restoreFailure;
          return Reflect.defineProperty(current, key, descriptor);
        },
      });
      const mock = WebFixture.Property.mock([
        { target, key: 'value', descriptor: { configurable: true, value: 'replacement' } },
      ]);
      let failure: unknown;

      try {
        try {
          nativeDefineProperty(Object.prototype, 'get', {
            configurable: true,
            get: () => undefined,
          });
          failure = captureFailure(() => mock.dispose());
        } finally {
          nativeDeleteProperty(Object.prototype, 'get');
          if (ambientGet !== undefined) {
            nativeDefineProperty(Object.prototype, 'get', ambientGet);
          }
        }

        const cleanup = expectCleanupError(failure, 'restore');
        expect(cleanup.errors).to.eql([restoreFailure]);
        expect(cleanup.rollback).to.equal(mock);
        expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('replacement');

        blockRestore = false;
        cleanup.rollback.dispose();
        expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('original');
      } finally {
        blockRestore = false;
        try {
          mock.dispose();
        } finally {
          nativeDefineProperty(backing, 'value', original);
        }
      }
    });

    it('cleanup error guard → rejects reflective structural clones', () => {
      const backing = {};
      let blockRestore = true;
      const target = new Proxy(backing, {
        deleteProperty(current, key) {
          return blockRestore ? false : Reflect.deleteProperty(current, key);
        },
      });
      const mock = WebFixture.Property.mock([
        { target, key: 'value', descriptor: { configurable: true, value: 'replacement' } },
      ]);

      try {
        const cleanup = expectCleanupError(captureFailure(() => mock.dispose()), 'restore');
        const forged = new AggregateError([]);
        Object.defineProperties(forged, Object.getOwnPropertyDescriptors(cleanup));

        expect(WebFixture.Property.isCleanupError(cleanup)).to.eql(true);
        expect(WebFixture.Property.isCleanupError(forged)).to.eql(false);
        expect(forged).to.have.property('rollback', cleanup.rollback);

        blockRestore = false;
        cleanup.rollback.dispose();
      } finally {
        blockRestore = false;
        try {
          mock.dispose();
        } finally {
          Reflect.deleteProperty(backing, 'value');
        }
      }
    });

    it('out-of-order disposal → preserves recoverable ownership', () => {
      const target = {};
      const original = { configurable: true, value: 'original' };
      Object.defineProperty(target, 'value', original);
      const first = WebFixture.Property.mock([
        { target, key: 'value', descriptor: { configurable: true, value: 'first' } },
      ]);
      const second = WebFixture.Property.mock([
        { target, key: 'value', descriptor: { configurable: true, value: 'second' } },
      ]);

      try {
        const failure = captureFailure(() => first.dispose());
        const cleanup = expectCleanupError(failure, 'restore');
        expect(cleanup.rollback).to.equal(first);
        expect(Object.getOwnPropertyDescriptor(target, 'value')?.value).to.eql('second');

        second.dispose();
        expect(Object.getOwnPropertyDescriptor(target, 'value')?.value).to.eql('first');

        cleanup.rollback.dispose();
        expect(Object.getOwnPropertyDescriptor(target, 'value')?.value).to.eql('original');
      } finally {
        try {
          second.dispose();
        } finally {
          try {
            first.dispose();
          } finally {
            Object.defineProperty(target, 'value', original);
          }
        }
      }
    });

    it('restoration failure → continues cleanup and remains retryable', () => {
      const backing = {};
      Object.defineProperty(backing, 'first', { configurable: true, value: 'first' });
      Object.defineProperty(backing, 'second', { configurable: true, value: 'second' });
      const failure = new Error('second-restore-blocked');
      let blocked = true;
      const target = new Proxy(backing, {
        defineProperty(current, key, descriptor) {
          if (key === 'second' && descriptor.value === 'second' && blocked) throw failure;
          return Reflect.defineProperty(current, key, descriptor);
        },
      });
      const mock = WebFixture.Property.mock([
        { target, key: 'first', descriptor: { configurable: true, value: 'mock-first' } },
        { target, key: 'second', descriptor: { configurable: true, value: 'mock-second' } },
      ]);

      const cleanup = expectCleanupError(captureFailure(() => mock.dispose()), 'restore');
      expect(cleanup.errors).to.eql([failure]);
      expect(cleanup.rollback).to.equal(mock);
      expect(Object.getOwnPropertyDescriptor(backing, 'first')?.value).to.eql('first');
      expect(Object.getOwnPropertyDescriptor(backing, 'second')?.value).to.eql('mock-second');

      blocked = false;
      cleanup.rollback.dispose();
      expect(Object.getOwnPropertyDescriptor(backing, 'second')?.value).to.eql('second');
    });

    it('multiple restoration failures → aggregate in LIFO order', () => {
      const backing = {};
      Object.defineProperty(backing, 'first', { configurable: true, value: 'first' });
      Object.defineProperty(backing, 'second', { configurable: true, value: 'second' });
      const firstFailure = new Error('first-restore-blocked');
      const secondFailure = new Error('second-restore-blocked');
      let blocked = true;
      const target = new Proxy(backing, {
        defineProperty(current, key, descriptor) {
          if (blocked && key === 'first' && descriptor.value === 'first') throw firstFailure;
          if (blocked && key === 'second' && descriptor.value === 'second') throw secondFailure;
          return Reflect.defineProperty(current, key, descriptor);
        },
      });
      const mock = WebFixture.Property.mock([
        { target, key: 'first', descriptor: { configurable: true, value: 'mock-first' } },
        { target, key: 'second', descriptor: { configurable: true, value: 'mock-second' } },
      ]);

      const failure = expectCleanupError(captureFailure(() => mock.dispose()), 'restore');
      expect(failure.errors).to.eql([secondFailure, firstFailure]);

      blocked = false;
      mock.dispose();
      expect(Object.getOwnPropertyDescriptor(backing, 'first')?.value).to.eql('first');
      expect(Object.getOwnPropertyDescriptor(backing, 'second')?.value).to.eql('second');
    });

    it('absent-property deletion failure → remains retryable', () => {
      const backing = {};
      let blocked = true;
      const target = new Proxy(backing, {
        deleteProperty(current, key) {
          if (blocked && key === 'value') return false;
          return Reflect.deleteProperty(current, key);
        },
      });
      const mock = WebFixture.Property.mock([
        { target, key: 'value', descriptor: { configurable: true, value: 'replacement' } },
      ]);

      const failure = expectCleanupError(captureFailure(() => mock.dispose()), 'restore');
      expect(failure.errors).to.have.length(1);
      expect(failure.errors[0]).to.be.instanceof(TypeError);
      expect(failure.errors[0]).to.have.property(
        'message',
        'Failed to restore absent property: value',
      );
      expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('replacement');

      blocked = false;
      mock.dispose();
      mock.dispose();
      expect(Object.getOwnPropertyDescriptor(backing, 'value')).to.eql(undefined);
    });

    it('mutation intrinsics → remain available while their globals are replaced', () => {
      const nativeDefineProperty = Object.defineProperty;
      const nativeDeleteProperty = Reflect.deleteProperty;
      const definePropertyDescriptor = Object.getOwnPropertyDescriptor(Object, 'defineProperty')!;
      const deletePropertyDescriptor = Object.getOwnPropertyDescriptor(Reflect, 'deleteProperty')!;
      const replacementDefineProperty: typeof Object.defineProperty = () => {
        throw new Error('replacement defineProperty invoked');
      };
      const replacementDeleteProperty: typeof Reflect.deleteProperty = () => false;
      const target = {};
      let mock: t.WebFixture.Property.Mock | undefined;

      try {
        mock = WebFixture.Property.mock([
          {
            target: Object,
            key: 'defineProperty',
            descriptor: { configurable: true, writable: true, value: replacementDefineProperty },
          },
          {
            target: Reflect,
            key: 'deleteProperty',
            descriptor: { configurable: true, writable: true, value: replacementDeleteProperty },
          },
          {
            target,
            key: 'temporary',
            descriptor: { configurable: true, value: 'replacement' },
          },
        ]);

        expect(Object.defineProperty).to.equal(replacementDefineProperty);
        expect(Reflect.deleteProperty).to.equal(replacementDeleteProperty);
        mock.dispose();

        expect(Object.getOwnPropertyDescriptor(Object, 'defineProperty')).to.eql(
          definePropertyDescriptor,
        );
        expect(Object.getOwnPropertyDescriptor(Reflect, 'deleteProperty')).to.eql(
          deletePropertyDescriptor,
        );
        expect(Object.getOwnPropertyDescriptor(target, 'temporary')).to.eql(undefined);
      } finally {
        try {
          mock?.dispose();
        } finally {
          nativeDefineProperty(Object, 'defineProperty', definePropertyDescriptor);
          nativeDefineProperty(Reflect, 'deleteProperty', deletePropertyDescriptor);
          nativeDeleteProperty(target, 'temporary');
        }
      }
    });

    it('reentrant disposal → fails deterministically and remains retryable', () => {
      const backing = {};
      Object.defineProperty(backing, 'value', { configurable: true, value: 'original' });
      let reenter = true;
      let mock: t.WebFixture.Property.Mock | undefined;
      const target = new Proxy(backing, {
        defineProperty(current, key, descriptor) {
          if (reenter && key === 'value' && descriptor.value === 'original') mock?.dispose();
          return Reflect.defineProperty(current, key, descriptor);
        },
      });
      mock = WebFixture.Property.mock([
        { target, key: 'value', descriptor: { configurable: true, value: 'replacement' } },
      ]);

      const failure = expectCleanupError(captureFailure(() => mock?.dispose()), 'restore');
      expect(failure.errors).to.have.length(1);
      expect(failure.errors[0]).to.be.instanceof(TypeError);
      expect(failure.errors[0]).to.have.property(
        'message',
        'Property fixture disposal is already in progress.',
      );
      expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('replacement');

      reenter = false;
      mock.dispose();
      expect(Object.getOwnPropertyDescriptor(backing, 'value')?.value).to.eql('original');
    });

    it('nested transactions → restore in LIFO order', () => {
      const target = {};
      Object.defineProperty(target, 'value', { configurable: true, value: 'original' });
      const first = WebFixture.Property.mock([
        { target, key: 'value', descriptor: { configurable: true, value: 'first' } },
      ]);
      const second = WebFixture.Property.mock([
        { target, key: 'value', descriptor: { configurable: true, value: 'second' } },
      ]);

      second.dispose();
      expect(Object.getOwnPropertyDescriptor(target, 'value')?.value).to.eql('first');

      first.dispose();
      expect(Object.getOwnPropertyDescriptor(target, 'value')?.value).to.eql('original');
    });
  });
});

/** Require one branded cleanup failure with the expected recovery stage. */
function expectCleanupError(
  value: unknown,
  kind: t.WebFixture.Property.CleanupErrorKind,
): t.WebFixture.Property.CleanupError {
  const matches = WebFixture.Property.isCleanupError(value);
  expect(matches).to.eql(true);
  if (!matches) throw new Error('Expected a Property cleanup error.');
  expect(value.kind).to.eql(kind);
  return value;
}

/** Capture one expected synchronous failure. */
function captureFailure(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error('Expected operation to throw.');
}
