import { describe, expect, it } from '../../../-test.ts';
import { Fmt } from '../mod.ts';

type MutationCase = Readonly<{
  name: string;
  target: object;
  key: PropertyKey;
}>;

const defineProperty = Object.defineProperty;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

const methodMutations: readonly MutationCase[] = [
  { name: 'Math.abs', target: Math, key: 'abs' },
  { name: 'Set.prototype.add', target: Set.prototype, key: 'add' },
];

describe('Cli.Fmt presentation authority', () => {
  it('composes Text and Set authority without invoking changed methods', () => {
    for (const { name, target, key } of methodMutations) {
      const descriptor = getOwnPropertyDescriptor(target, key);
      if (!descriptor || !('value' in descriptor)) {
        throw new Error(`Missing ${name} data descriptor.`);
      }
      let calls = 0;
      let ready = true;

      defineProperty(target, key, {
        ...descriptor,
        value() {
          calls += 1;
          throw new Error(`Changed ${name} invoked.`);
        },
      });
      try {
        ready = Fmt.isReady();
      } finally {
        defineProperty(target, key, descriptor);
      }

      expect({ name, calls, ready }).to.eql({ name, calls: 0, ready: false });
      expect(Fmt.isReady()).to.eql(true);
    }
  });

  it('detects global Set replacement', () => {
    const descriptor = getOwnPropertyDescriptor(globalThis, 'Set');
    if (!descriptor || !('value' in descriptor)) {
      throw new Error('Missing global Set data descriptor.');
    }

    let ready = true;
    defineProperty(globalThis, 'Set', { ...descriptor, value: class ReplacementSet {} });
    try {
      ready = Fmt.isReady();
    } finally {
      defineProperty(globalThis, 'Set', descriptor);
    }

    expect(ready).to.eql(false);
    expect(Fmt.isReady()).to.eql(true);
  });

  it('detects unexpected Set shape additions without invoking accessors', () => {
    const key = Symbol('fmt-authority-test');
    let getterCalls = 0;
    let ready = true;
    defineProperty(Set.prototype, key, {
      configurable: true,
      get() {
        getterCalls += 1;
        throw new Error('Unexpected Set descriptor invoked.');
      },
    });
    try {
      ready = Fmt.isReady();
    } finally {
      Reflect.deleteProperty(Set.prototype, key);
    }

    expect({ getterCalls, ready }).to.eql({ getterCalls: 0, ready: false });
    expect(Fmt.isReady()).to.eql(true);
  });
});
