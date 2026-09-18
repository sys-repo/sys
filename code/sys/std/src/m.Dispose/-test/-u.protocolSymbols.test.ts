import { describe, expect, it } from './common.ts';
import { installDisposalProtocolSymbols } from '../u.protocolSymbols.ts';

type ProtocolSymbolSource = {
  dispose?: symbol;
  asyncDispose?: symbol;
};

const descriptor = (source: object, key: keyof ProtocolSymbolSource) =>
  Object.getOwnPropertyDescriptor(source, key);

const expectInstalledSymbol = (
  source: ProtocolSymbolSource,
  key: keyof ProtocolSymbolSource,
) => {
  const current = descriptor(source, key);
  expect(typeof current?.value).to.eql('symbol');
  expect(current?.value.description).to.eql(`Symbol.${key}`);
  expect(current?.configurable).to.eql(false);
  expect(current?.enumerable).to.eql(false);
  expect(current?.writable).to.eql(false);
  expect(Symbol.keyFor(current?.value)).to.eql(undefined);
};

const expectCompatibilityError = (fn: () => void) =>
  expect(fn).to.throw(TypeError, 'ECMAScript disposal protocol symbols are incompatible');

describe('Dispose protocol symbol compatibility', () => {
  describe('public entrypoint', () => {
    it('is side-effect-only and preserves incumbent runtime symbols', async () => {
      const dispose = Symbol.dispose;
      const asyncDispose = Symbol.asyncDispose;

      const module = await import('@sys/std/dispose/compat');

      expect(Object.keys(module)).to.eql([]);
      expect(Symbol.dispose).to.equal(dispose);
      expect(Symbol.asyncDispose).to.equal(asyncDispose);
    });
  });

  describe('compatible definitions', () => {
    it('preserves existing descriptors and identities across repeated installation', () => {
      const dispose = Symbol('existing:dispose');
      const asyncDispose = Symbol('existing:asyncDispose');
      const source: ProtocolSymbolSource = {};
      Object.defineProperties(source, {
        dispose: { configurable: true, enumerable: true, value: dispose, writable: true },
        asyncDispose: {
          configurable: false,
          enumerable: false,
          value: asyncDispose,
          writable: false,
        },
      });
      const before = Object.getOwnPropertyDescriptors(source);

      installDisposalProtocolSymbols(source);
      installDisposalProtocolSymbols(source);

      expect(Object.getOwnPropertyDescriptors(source)).to.eql(before);
      expect(source.dispose).to.equal(dispose);
      expect(source.asyncDispose).to.equal(asyncDispose);
    });

    it('accepts a compatible non-extensible source without mutation', () => {
      const source = Object.preventExtensions({
        dispose: Symbol('existing:dispose'),
        asyncDispose: Symbol('existing:asyncDispose'),
      });
      const before = Object.getOwnPropertyDescriptors(source);

      installDisposalProtocolSymbols(source);

      expect(Object.getOwnPropertyDescriptors(source)).to.eql(before);
    });
  });

  describe('missing definitions', () => {
    it('installs both missing symbols with protocol descriptors and fresh identities', () => {
      const source: ProtocolSymbolSource = {};

      installDisposalProtocolSymbols(source);

      expectInstalledSymbol(source, 'dispose');
      expectInstalledSymbol(source, 'asyncDispose');
      expect(source.dispose).not.to.equal(source.asyncDispose);
    });

    it('installs either missing symbol without changing its incumbent peer', () => {
      for (const incumbentKey of ['dispose', 'asyncDispose'] as const) {
        const missingKey = incumbentKey === 'dispose' ? 'asyncDispose' : 'dispose';
        const incumbentSymbol = Symbol(`existing:${incumbentKey}`);
        const source: ProtocolSymbolSource = {};
        Object.defineProperty(source, incumbentKey, {
          configurable: true,
          enumerable: true,
          value: incumbentSymbol,
          writable: true,
        });
        const incumbent = descriptor(source, incumbentKey);

        installDisposalProtocolSymbols(source);

        expect(descriptor(source, incumbentKey)).to.eql(incumbent);
        expect(source[incumbentKey]).to.equal(incumbentSymbol);
        expectInstalledSymbol(source, missingKey);
      }
    });

    it('pre-creates all values and commits one descriptor batch', () => {
      const source: ProtocolSymbolSource = {};
      let calls = 0;
      let observed: PropertyDescriptorMap | undefined;

      installDisposalProtocolSymbols(source, (target, descriptors) => {
        calls++;
        observed = descriptors;
        expect(typeof descriptors.dispose?.value).to.eql('symbol');
        expect(typeof descriptors.asyncDispose?.value).to.eql('symbol');
        return Object.defineProperties(target, descriptors);
      });

      expect(calls).to.eql(1);
      expect(Object.keys(observed ?? {})).to.eql(['dispose', 'asyncDispose']);
      expectInstalledSymbol(source, 'dispose');
      expectInstalledSymbol(source, 'asyncDispose');
    });
  });

  describe('incompatible definitions', () => {
    it('rejects malformed or inherited definitions before mutation', () => {
      const cases: object[] = [
        { dispose: undefined },
        { asyncDispose: undefined },
        { dispose: 'not-symbol' },
        { asyncDispose: 'not-symbol' },
        Object.defineProperty({}, 'dispose', { get: () => Symbol('accessor') }),
        Object.defineProperty({}, 'asyncDispose', { get: () => Symbol('accessor') }),
        Object.create({ dispose: Symbol('inherited') }),
        Object.create({ asyncDispose: Symbol('inherited') }),
      ];

      for (const source of cases) {
        const before = Object.getOwnPropertyDescriptors(source);
        expectCompatibilityError(() => installDisposalProtocolSymbols(source));
        expect(Object.getOwnPropertyDescriptors(source)).to.eql(before);
      }
    });

    it('rejects required installation on a non-extensible source before mutation', () => {
      const source = Object.preventExtensions({ dispose: Symbol('existing:dispose') });
      const before = Object.getOwnPropertyDescriptors(source);

      expectCompatibilityError(() => installDisposalProtocolSymbols(source));
      expect(Object.getOwnPropertyDescriptors(source)).to.eql(before);
    });
  });
});
