import { describe, expect, Is, it } from '../../../-test.ts';
import { terminal } from '../../m.Is/u.terminal.ts';
import { Screen } from '../../m.Screen/mod.ts';
import {
  MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS,
  MAX_WIDTH_COLLECTION_LENGTH,
} from '../../u/u.layout.ts';
import { Text } from '../m.Text.ts';
import { fitWithScreen } from '../u.width.ts';

const apply = Reflect.apply;
const defineProperty = Object.defineProperty;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;

const FAILURE = 'Cli.Fmt.Text presentation authority unavailable.';
const stringIteratorPrototype = getPrototypeOf('authority'[Symbol.iterator]());
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const segments = segmenter.segment('authority');
const segmentIteratorPrototype = getPrototypeOf(segments[Symbol.iterator]());

type MutationCase = Readonly<{
  readonly name: string;
  readonly target: object;
  readonly key: PropertyKey;
}>;

const publicOperations: readonly (() => unknown)[] = [
  () => Text.Width.measure('界'),
  () => Text.Width.padEnd('界', 4),
  () => Text.Width.max(['界']),
  () => Text.Width.fit({ width: 80 }),
  () => Text.Wrap.text('alpha beta', { width: 5 }),
  () => Text.Wrap.lines('alpha beta', { width: 5 }),
  () => Text.ellipsize('abcdef', 3),
];

const shapeMutations: readonly MutationCase[] = [
  { name: 'Number.isNaN', target: Number, key: 'isNaN' },
  { name: 'Math.abs', target: Math, key: 'abs' },
  { name: 'String.prototype.codePointAt', target: String.prototype, key: 'codePointAt' },
  { name: 'RegExp.prototype[Symbol.split]', target: RegExp.prototype, key: Symbol.split },
  { name: 'Array[Symbol.species]', target: Array, key: Symbol.species },
  { name: 'string iterator next', target: stringIteratorPrototype, key: 'next' },
  { name: 'Intl.Segmenter.prototype.segment', target: Intl.Segmenter.prototype, key: 'segment' },
  { name: 'segment iterator next', target: segmentIteratorPrototype, key: 'next' },
];

describe('Cli.Fmt.Text presentation authority', () => {
  it('fails closed for every changed intrinsic shape without invoking hostile descriptors', () => {
    for (let index = 0; index < shapeMutations.length; index += 1) {
      const { name, target, key } = shapeMutations[index];
      const descriptor = getOwnPropertyDescriptor(target, key);
      if (!descriptor) throw new Error(`Missing ${name} descriptor.`);
      let calls = 0;
      let ready = true;
      const failures: unknown[] = [];

      defineProperty(target, key, hostileDescriptor(descriptor, () => calls += 1));
      try {
        ready = Text.isReady();
        for (
          let operationIndex = 0;
          operationIndex < publicOperations.length;
          operationIndex += 1
        ) {
          failures[operationIndex] = failureOf(publicOperations[operationIndex]);
        }
      } finally {
        defineProperty(target, key, descriptor);
      }

      expect({ name, calls, ready }).to.eql({ name, calls: 0, ready: false });
      for (let failureIndex = 0; failureIndex < failures.length; failureIndex += 1) {
        expectFixedFailure(failures[failureIndex]);
      }
      expect(Text.isReady()).to.eql(true);
    }
  });

  it('detects expected-absent owned iterator state and arbitrary prototype additions', () => {
    const cases: readonly MutationCase[] = [
      { name: 'segment iterator return', target: segmentIteratorPrototype, key: 'return' },
      { name: 'array numeric accessor', target: Array.prototype, key: '987654321' },
    ];

    for (let index = 0; index < cases.length; index += 1) {
      const { name, target, key } = cases[index];
      if (getOwnPropertyDescriptor(target, key)) throw new Error(`Unexpected ${name} descriptor.`);
      const lengthDescriptor = target === Array.prototype
        ? getOwnPropertyDescriptor(Array.prototype, 'length')
        : undefined;
      let calls = 0;
      let ready = true;
      let failure: unknown;

      defineProperty(target, key, {
        configurable: true,
        get() {
          calls += 1;
          throw new Error(`Hostile ${name} invoked.`);
        },
      });
      try {
        ready = Text.isReady();
        failure = failureOf(() => Text.ellipsize('abcdef', 1, { ellipsis: '界界' }));
      } finally {
        delete (target as Record<PropertyKey, unknown>)[key];
        if (lengthDescriptor) defineProperty(Array.prototype, 'length', lengthDescriptor);
      }

      expect({ name, calls, ready }).to.eql({ name, calls: 0, ready: false });
      expectFixedFailure(failure);
      expect(Text.isReady()).to.eql(true);
    }
  });

  it('owns terminal detection and measurement through their lower runtime providers', () => {
    const denoDescriptor = getOwnPropertyDescriptor(globalThis, 'Deno');
    const terminalOwner = getPrototypeOf(Deno.stdout);
    const terminalDescriptor = getOwnPropertyDescriptor(terminalOwner, 'isTerminal');
    const consoleSizeDescriptor = getOwnPropertyDescriptor(Deno, 'consoleSize');
    const processDescriptor = getOwnPropertyDescriptor(globalThis, 'process');
    if (!denoDescriptor || !('value' in denoDescriptor)) {
      throw new Error('Missing global Deno descriptor.');
    }
    if (!terminalDescriptor || !('value' in terminalDescriptor)) {
      throw new Error('Missing Deno stream terminal descriptor.');
    }
    if (!consoleSizeDescriptor || !('value' in consoleSizeDescriptor)) {
      throw new Error('Missing Deno.consoleSize descriptor.');
    }
    if (!processDescriptor) throw new Error('Missing global process descriptor.');

    let denoTerminal = true;
    let denoSize: unknown;
    let denoFailure: unknown;
    defineProperty(globalThis, 'Deno', { ...denoDescriptor, value: {} });
    try {
      denoTerminal = terminal('stdout');
      denoSize = Screen.size();
      denoFailure = failureOf(() => Text.Width.fit());
    } finally {
      defineProperty(globalThis, 'Deno', denoDescriptor);
    }

    let terminalCalls = 0;
    let terminalResult = true;
    let terminalFailure: unknown;
    defineProperty(terminalOwner, 'isTerminal', {
      ...terminalDescriptor,
      value: () => {
        terminalCalls += 1;
        throw new Error('Hostile terminal probe invoked.');
      },
    });
    try {
      terminalResult = terminal('stdout');
      terminalFailure = failureOf(() => Text.Width.fit());
    } finally {
      defineProperty(terminalOwner, 'isTerminal', terminalDescriptor);
    }

    let consoleSizeCalls = 0;
    let screenSize: unknown;
    let screenFailure: unknown;
    defineProperty(Deno, 'consoleSize', {
      ...consoleSizeDescriptor,
      value: () => {
        consoleSizeCalls += 1;
        throw new Error('Hostile screen measurement invoked.');
      },
    });
    try {
      screenSize = Screen.size();
      screenFailure = failureOf(() => Text.Width.fit({ terminal: true }));
    } finally {
      defineProperty(Deno, 'consoleSize', consoleSizeDescriptor);
    }

    let processCalls = 0;
    let processSize: unknown;
    let processFailure: unknown;
    defineProperty(globalThis, 'process', {
      configurable: processDescriptor.configurable,
      enumerable: processDescriptor.enumerable,
      get() {
        processCalls += 1;
        throw new Error('Hostile process provider invoked.');
      },
    });
    try {
      processSize = Screen.size();
      processFailure = failureOf(() => Text.Width.fit({ terminal: false }));
    } finally {
      defineProperty(globalThis, 'process', processDescriptor);
    }

    expect({ denoTerminal, denoSize }).to.eql({
      denoTerminal: false,
      denoSize: { width: 80, height: 24 },
    });
    expect({ terminalCalls, terminalResult }).to.eql({ terminalCalls: 0, terminalResult: false });
    expect({ consoleSizeCalls, screenSize }).to.eql({
      consoleSizeCalls: 0,
      screenSize: { width: 80, height: 24 },
    });
    expect({ processCalls, processSize }).to.eql({
      processCalls: 0,
      processSize: { width: 80, height: 24 },
    });
    expectFixedFailure(denoFailure);
    expectFixedFailure(terminalFailure);
    expectFixedFailure(screenFailure);
    expectFixedFailure(processFailure);
    expect(Text.isReady()).to.eql(true);
  });

  it('rejects post-import Node-style dimension descriptor mutation before access', () => {
    const processDescriptor = getOwnPropertyDescriptor(globalThis, 'process');
    if (!processDescriptor) throw new Error('Missing global process descriptor.');
    const process = descriptorValue(globalThis, processDescriptor);
    if (!Is.object(process)) throw new Error('Missing process provider.');

    const stdoutDescriptor = getOwnPropertyDescriptor(process, 'stdout');
    if (!stdoutDescriptor) throw new Error('Missing process stdout descriptor.');
    const stdout = descriptorValue(process, stdoutDescriptor);
    if (!Is.object(stdout)) throw new Error('Missing process stdout provider.');

    for (const key of ['columns', 'rows'] as const) {
      const found = findDescriptor(stdout, key);
      if (!found || !found.descriptor.configurable) {
        throw new Error(`Missing configurable process stdout ${key} descriptor.`);
      }

      let calls = 0;
      let ready = true;
      let failure: unknown;
      defineProperty(found.owner, key, {
        configurable: found.descriptor.configurable,
        enumerable: found.descriptor.enumerable,
        get() {
          calls += 1;
          throw new Error(`Hostile process stdout ${key} invoked.`);
        },
      });
      try {
        ready = Text.isReady();
        failure = failureOf(() => Text.Width.fit({ terminal: true }));
      } finally {
        defineProperty(found.owner, key, found.descriptor);
      }

      expect({ key, calls, ready }).to.eql({ key, calls: 0, ready: false });
      expectFixedFailure(failure);
      expect(Text.isReady()).to.eql(true);
    }
  });

  it('transactionally re-admits Proxy collection reads and throwing option getters', () => {
    const trimDescriptor = dataDescriptor(String.prototype, 'trim');
    let trimCalls = 0;
    let lengthFailure: unknown;
    const inputs = new Proxy([] as string[], {
      get(target, key, receiver) {
        if (key === 'length') {
          defineProperty(String.prototype, 'trim', {
            ...trimDescriptor,
            value: () => {
              trimCalls += 1;
              throw new Error('Hostile trim invoked.');
            },
          });
          return 0;
        }
        return Reflect.get(target, key, receiver);
      },
    });
    try {
      lengthFailure = failureOf(() => Text.Width.max(inputs));
    } finally {
      defineProperty(String.prototype, 'trim', trimDescriptor);
    }

    let elementFailure: unknown;
    const elementInputs = ['界'];
    defineProperty(elementInputs, '0', {
      configurable: true,
      get() {
        defineProperty(String.prototype, 'trim', {
          ...trimDescriptor,
          value: () => {
            trimCalls += 1;
            throw new Error('Hostile trim invoked.');
          },
        });
        return '界';
      },
    });
    try {
      elementFailure = failureOf(() => Text.Width.max(elementInputs));
    } finally {
      defineProperty(String.prototype, 'trim', trimDescriptor);
    }

    let getterFailure: unknown;
    const callerFailure = new Error('Hostile option getter.');
    const options = {
      get width(): number {
        defineProperty(String.prototype, 'trim', {
          ...trimDescriptor,
          value: () => {
            trimCalls += 1;
            throw new Error('Hostile trim invoked.');
          },
        });
        throw callerFailure;
      },
    };
    try {
      getterFailure = failureOf(() => Text.Width.fit(options));
    } finally {
      defineProperty(String.prototype, 'trim', trimDescriptor);
    }

    expect(trimCalls).to.eql(0);
    expectFixedFailure(lengthFailure);
    expectFixedFailure(elementFailure);
    expectFixedFailure(getterFailure);

    const unchangedFailure = failureOf(() =>
      Text.Width.fit({
        get width(): number {
          throw callerFailure;
        },
      })
    );
    expect(unchangedFailure).to.equal(callerFailure);
  });

  it('admits collection length without caller coercion or unbounded iteration', () => {
    let coercions = 0;
    let reads = 0;
    const callerLength = {
      [Symbol.toPrimitive]() {
        coercions += 1;
        throw new Error('Caller length coercion invoked.');
      },
    };
    const invalidLengths: readonly unknown[] = [
      callerLength,
      Symbol('length'),
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ];
    const failures: unknown[] = [];
    for (let index = 0; index < invalidLengths.length; index += 1) {
      const inputs = new Proxy([] as string[], {
        get(_target, key) {
          if (key === 'length') return invalidLengths[index];
          reads += 1;
          return '界';
        },
      });
      failures[index] = failureOf(() => Text.Width.max(inputs));
    }

    const fractional = new Proxy(['a', '界'], {
      get(target, key, receiver) {
        if (key === 'length') return 1.1;
        return Reflect.get(target, key, receiver);
      },
    });

    let hasCalls = 0;
    let missingReads = 0;
    const missing = new Proxy([] as string[], {
      get(_target, key) {
        if (key === 'length') return 1;
        missingReads += 1;
        return '界';
      },
      has(_target, key) {
        if (key === '0') hasCalls += 1;
        return false;
      },
    });

    const exactLimit = new Array<string>(MAX_WIDTH_COLLECTION_LENGTH);
    exactLimit[MAX_WIDTH_COLLECTION_LENGTH - 1] = '界';
    let oversizedHasCalls = 0;
    const oversized = new Proxy([] as string[], {
      get(_target, key) {
        return key === 'length' ? MAX_WIDTH_COLLECTION_LENGTH + 1 : '界';
      },
      has() {
        oversizedHasCalls += 1;
        return true;
      },
    });
    const oversizedFailure = failureOf(() => Text.Width.max(oversized));

    expect({ coercions, reads }).to.eql({ coercions: 0, reads: 0 });
    for (let index = 0; index < failures.length; index += 1) {
      expect((failures[index] as Error).message).to.eql(
        'Cli.Fmt.Text Width.max input length invalid.',
      );
      expect(failures[index]).to.equal(failures[0]);
    }
    expect(Object.isFrozen(failures[0])).to.eql(true);

    const finiteLimitFailure = failureOf(() =>
      Text.Width.measure('a'.repeat(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS + 1))
    );
    expect((oversizedFailure as Error).message).to.eql(
      'Cli.Fmt.Text finite presentation limit exceeded.',
    );
    expect(oversizedFailure).to.equal(finiteLimitFailure);
    expect(oversizedHasCalls).to.eql(0);
    expect(Text.Width.max(exactLimit)).to.eql(2);
    expect(Text.Width.max(fractional)).to.eql(1);
    expect(Text.Width.max({ 0: '界', length: -1 } as unknown as string[])).to.eql(0);
    expect(Text.Width.max(missing)).to.eql(0);
    expect({ hasCalls, missingReads }).to.eql({ hasCalls: 1, missingReads: 0 });
    expect(Text.Width.max({ 0: '界', length: 1 } as unknown as string[])).to.eql(2);
    expect(Text.isReady()).to.eql(true);
  });

  it('admits cumulative Width.max text before running owned measurement work', () => {
    const exact = 'a'.repeat(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS);
    let trailingReads = 0;
    const inputs = new Proxy([exact, 'a', 'unreachable'], {
      get(target, key, receiver) {
        if (key === '2') trailingReads += 1;
        return Reflect.get(target, key, receiver);
      },
    });

    const failure = failureOf(() => Text.Width.max(inputs));

    expect(trailingReads).to.eql(0);
    expect((failure as Error).message).to.eql(
      'Cli.Fmt.Text finite presentation limit exceeded.',
    );
    expect(Object.isFrozen(failure)).to.eql(true);
    expect(Text.isReady()).to.eql(true);
  });

  it('rejects non-string ellipsis and renderer results without coercion', () => {
    let coercions = 0;
    const hostile = {
      [Symbol.toPrimitive]() {
        coercions += 1;
        throw new Error('Caller text coercion invoked.');
      },
    };
    const expected = Text.ellipsize('abcdef', 3);
    const marker = Text.ellipsize('abcdef', 3, {
      ellipsis: hostile as unknown as string,
    });
    const rendered = Text.ellipsize('abcdef', 3, {
      render: () => hostile as unknown as string,
    });
    const nonFunction = Text.ellipsize('abcdef', 3, {
      render: hostile as unknown as () => string,
    });

    expect({ marker, rendered, nonFunction, coercions }).to.eql({
      marker: expected,
      rendered: expected,
      nonFunction: expected,
      coercions: 0,
    });
    expect(Text.isReady()).to.eql(true);
  });

  it('does not coerce runtime-invalid text inputs', () => {
    let coercions = 0;
    const hostile = {
      [Symbol.toPrimitive]() {
        coercions += 1;
        throw new Error('Caller text coercion invoked.');
      },
    } as unknown as string;

    expect(Text.Width.measure(hostile)).to.eql(0);
    expect(Text.Width.padEnd(hostile, 2)).to.eql('  ');
    expect(Text.Width.max([hostile])).to.eql(0);
    expect(Text.ellipsize(hostile, 3)).to.eql('');
    expect(Text.Wrap.lines(hostile, { width: 5 })).to.eql(['']);
    expect(Text.Wrap.text(hostile, { width: 5 })).to.eql('');
    expect(coercions).to.eql(0);
    expect(Text.isReady()).to.eql(true);
  });

  it('re-admits before continuing after preserve and renderer callbacks', () => {
    const pushDescriptor = dataDescriptor(Array.prototype, 'push');
    const joinDescriptor = dataDescriptor(Array.prototype, 'join');
    let pushCalls = 0;
    let preserveCalls = 0;
    let preserveFailure: unknown;
    try {
      preserveFailure = failureOf(() =>
        Text.Wrap.lines('alpha beta', {
          width: 5,
          preserve: () => {
            preserveCalls += 1;
            defineProperty(Array.prototype, 'push', {
              configurable: pushDescriptor.configurable,
              enumerable: pushDescriptor.enumerable,
              get() {
                pushCalls += 1;
                throw new Error('Hostile push accessor invoked.');
              },
            });
            return false;
          },
        })
      );
    } finally {
      defineProperty(Array.prototype, 'push', pushDescriptor);
    }

    let joinCalls = 0;
    let renderCalls = 0;
    let renderFailure: unknown;
    try {
      renderFailure = failureOf(() =>
        Text.ellipsize('abcdefghij', 6, {
          render: () => {
            renderCalls += 1;
            defineProperty(Array.prototype, 'join', {
              ...joinDescriptor,
              value: () => {
                joinCalls += 1;
                throw new Error('Hostile join invoked.');
              },
            });
            return undefined as unknown as string;
          },
        })
      );
    } finally {
      defineProperty(Array.prototype, 'join', joinDescriptor);
    }

    expect({ preserveCalls, pushCalls }).to.eql({ preserveCalls: 1, pushCalls: 0 });
    expect({ renderCalls, joinCalls }).to.eql({ renderCalls: 1, joinCalls: 0 });
    expectFixedFailure(preserveFailure);
    expectFixedFailure(renderFailure);
  });

  it('re-admits returned screen dimensions before numeric normalization', () => {
    const finiteDescriptor = dataDescriptor(Number, 'isFinite');
    let finiteCalls = 0;
    let failure: unknown;
    const screenSize = () => ({
      get width() {
        defineProperty(Number, 'isFinite', {
          ...finiteDescriptor,
          value: () => {
            finiteCalls += 1;
            throw new Error('Hostile finite invoked.');
          },
        });
        return 80;
      },
      height: 24,
    });
    try {
      failure = failureOf(() => fitWithScreen(screenSize, { terminal: true }));
    } finally {
      defineProperty(Number, 'isFinite', finiteDescriptor);
    }

    expect(finiteCalls).to.eql(0);
    expectFixedFailure(failure);
    expect(Text.isReady()).to.eql(true);
  });

  it('never dispatches through caller-overridden collection methods', () => {
    const inputs = ['界'];
    let calls = 0;
    defineProperty(inputs, 'reduce', {
      configurable: true,
      get() {
        calls += 1;
        throw new Error('Caller reduction authority invoked.');
      },
    });

    expect(Text.Width.max(inputs)).to.eql(2);
    expect(calls).to.eql(0);
  });
});

function hostileDescriptor(
  descriptor: PropertyDescriptor,
  invoked: () => void,
): PropertyDescriptor {
  if ('value' in descriptor) {
    return {
      ...descriptor,
      value: () => {
        invoked();
        throw new Error('Hostile data authority invoked.');
      },
    };
  }
  return {
    ...descriptor,
    get() {
      invoked();
      throw new Error('Hostile accessor authority invoked.');
    },
  };
}

function descriptorValue(owner: object, descriptor: PropertyDescriptor): unknown {
  if ('value' in descriptor) return descriptor.value;
  return descriptor.get ? apply(descriptor.get, owner, []) : undefined;
}

function findDescriptor(
  target: object,
  key: PropertyKey,
): { readonly owner: object; readonly descriptor: PropertyDescriptor } | undefined {
  let owner: object | null = target;
  while (owner) {
    const descriptor = getOwnPropertyDescriptor(owner, key);
    if (descriptor) return { owner, descriptor };
    owner = getPrototypeOf(owner);
  }
}

function dataDescriptor(target: object, key: PropertyKey): PropertyDescriptor & { value: unknown } {
  const descriptor = getOwnPropertyDescriptor(target, key);
  if (!descriptor || !('value' in descriptor)) {
    throw new Error(`Missing ${String(key)} descriptor.`);
  }
  return descriptor as PropertyDescriptor & { value: unknown };
}

function failureOf(operation: () => unknown): unknown {
  try {
    operation();
  } catch (cause) {
    return cause;
  }
}

function expectFixedFailure(failure: unknown): void {
  expect(failure).to.be.instanceOf(Error);
  expect((failure as Error).message).to.eql(FAILURE);
}
