import { afterAll, describe, it } from './mod.ts';
import type { Bdd } from './t.Bdd.ts';

const order: string[] = [];
let executionContractReached = false;

describe(
  'BDD execution contracts',
  {
    beforeAll: [
      () => {
        order.push('root:beforeAll:1');
      },
      () => {
        order.push('root:beforeAll:2');
      },
    ],
    beforeEach: [
      () => {
        order.push('root:beforeEach:1');
      },
      () => {
        order.push('root:beforeEach:2');
      },
    ],
    afterEach: [
      () => {
        order.push('root:afterEach:1');
      },
      () => {
        order.push('root:afterEach:2');
      },
    ],
    afterAll: [
      () => order.push('root:afterAll:1'),
      () => {
        order.push('root:afterAll:2');
        assertSequence(order, [
          'root:beforeAll:1',
          'root:beforeAll:2',
          'root:beforeEach:1',
          'root:beforeEach:2',
          'root:test',
          'root:afterEach:1',
          'root:afterEach:2',
          'nested:beforeAll',
          'root:beforeEach:1',
          'root:beforeEach:2',
          'nested:beforeEach',
          'nested:test',
          'nested:afterEach',
          'root:afterEach:1',
          'root:afterEach:2',
          'nested:afterAll',
          'root:afterAll:1',
          'root:afterAll:2',
        ]);
        executionContractReached = true;
      },
    ],
  },
  () => {
    it('runs a root leaf', () => {
      order.push('root:test');
    });

    describe(
      'nested suite',
      {
        beforeAll: () => {
          order.push('nested:beforeAll');
        },
        beforeEach: () => {
          order.push('nested:beforeEach');
        },
        afterEach: () => {
          order.push('nested:afterEach');
        },
        afterAll: () => {
          order.push('nested:afterAll');
        },
      },
      () => {
        it('runs a nested leaf', () => {
          order.push('nested:test');
        });
      },
    );
  },
);

type State = { count?: number; sibling?: string; nested?: boolean };

describe<State>(
  'BDD context contracts',
  {
    beforeAll() {
      this.count = 10;
    },
    beforeEach() {
      this.count = (this.count ?? 0) + 1;
    },
    afterEach() {
      assert(this.count === 12, 'afterEach did not receive the leaf context.');
    },
  },
  () => {
    it('shares one leaf context across hooks and body', function (context) {
      assert(
        context.name.includes('shares one leaf context'),
        'Deno.TestContext was not forwarded.',
      );
      assert(this.count === 11, 'beforeEach context was not forwarded to the body.');
      this.count++;
      this.sibling = 'first';
    });

    it('copies context between sibling leaves', function () {
      assert(this.count === 11, 'all-hook context was not copied into the sibling leaf.');
      assert(this.sibling === undefined, 'sibling leaf mutation leaked.');
      this.count++;
    });

    describe<State>(
      'nested context',
      {
        beforeAll() {
          this.nested = true;
        },
      },
      () => {
        it('inherits all-hook context through a shallow copy', function () {
          assert(
            this.count === 11,
            'parent each-hook context was not shared with the nested leaf.',
          );
          assert(this.nested === true, 'nested all-hook context was not inherited.');
          this.count++;
        });
      },
    );
  },
);

let ignoredSuiteBodyRan = false;
let ignoredTestBodyRan = false;
let modifierContractReached = false;

describe('BDD modifier contracts', () => {
  describe.skip('body-less skipped suite');
  describe.todo('body-less todo suite');
  describe.ignore('ignored suite callback', () => {
    ignoredSuiteBodyRan = true;
  });
  it.skip('body-less skipped test');
  it.todo('body-less todo test');
  it.ignore('ignored test body', () => {
    ignoredTestBodyRan = true;
  });

  afterAll(() => {
    assert(!ignoredSuiteBodyRan, 'Ignored suite callback executed.');
    assert(!ignoredTestBodyRan, 'Ignored test body executed.');
    modifierContractReached = true;
  });
});

const ignoredLeafHooks: string[] = [];
describe(
  'BDD all-hooks with ignored leaves',
  {
    beforeAll: () => {
      ignoredLeafHooks.push('beforeAll');
    },
    afterAll: () => {
      ignoredLeafHooks.push('afterAll');
    },
  },
  () => {
    it.skip('ignored leaf');
  },
);

const handled = describe('BDD suite handle contract');
it(handled, 'registers a test against an explicit suite handle', () => undefined);

let thenableError: Error | undefined;
try {
  describe('BDD thenable rejection', (() => ({ then() {} })) as unknown as Bdd.DescribeBody);
} catch (error) {
  thenableError = error instanceof Error ? error : new Error(String(error));
}

describe('BDD registration guards', () => {
  it('rejects thenable suite registration', () => {
    assert(
      thenableError?.message.includes('Returning a thenable from "describe"') === true,
      'Thenable suite registration was not rejected.',
    );
  });

  it('rejects registration after execution starts', () => {
    const error = captureError(() => it('late registration', () => undefined));
    assert(
      error.message.includes('after registered tests start running'),
      'Late registration did not fail clearly.',
    );
  });
});

Deno.test('BDD native bootstrap → proves suite execution', () => {
  assert(executionContractReached, 'BDD execution contract did not reach its final assertion.');
  assert(modifierContractReached, 'BDD modifier contract did not reach its final assertion.');
  assertSequence(ignoredLeafHooks, ['beforeAll', 'afterAll']);
});

Deno.test('BDD step policy boundary → emits exact owned keys', async () => {
  const registered: Deno.TestDefinition[] = [];
  const original = Deno.test;
  try {
    const capture = ((definition: Deno.TestDefinition) => {
      registered.push(definition);
    }) as typeof Deno.test;
    assert(Reflect.set(Deno, 'test', capture), 'Could not install the Deno.test capture.');

    const isolated = await import('./m.Bdd.ts?step-policy-capture');
    isolated.describe('captured suite', () => {
      isolated.it(
        'explicit policy',
        {
          ignore: false,
          sanitizeOps: false,
          sanitizeResources: true,
          sanitizeExit: false,
        },
        () => undefined,
      );
      isolated.it('omitted policy', () => undefined);
    });
  } finally {
    assert(Reflect.set(Deno, 'test', original), 'Could not restore Deno.test.');
  }

  assert(registered.length === 1, `Expected one captured suite, received ${registered.length}.`);
  const steps: Deno.TestStepDefinition[] = [];
  const context = {
    step: (definition: Deno.TestStepDefinition) => {
      steps.push(definition);
      return Promise.resolve(true);
    },
  } as unknown as Deno.TestContext;
  await registered[0]?.fn(context);

  assert(steps.length === 2, `Expected two captured steps, received ${steps.length}.`);
  const explicit = steps[0];
  const omitted = steps[1];
  assert(explicit?.ignore === false, 'Explicit ignore policy was not forwarded.');
  assert(explicit?.sanitizeOps === false, 'Explicit operation policy was not forwarded.');
  assert(explicit?.sanitizeResources === true, 'Explicit resource policy was not forwarded.');
  assert(explicit?.sanitizeExit === false, 'Explicit exit policy was not forwarded.');
  assert(
    !Object.hasOwn(explicit ?? {}, 'only'),
    'Nested focus policy leaked into Deno step options.',
  );
  assert(
    !Object.hasOwn(explicit ?? {}, 'permissions'),
    'Nested permissions leaked into Deno step options.',
  );
  assert(
    !Object.hasOwn(explicit ?? {}, 'timeout'),
    'Nested timeout leaked into Deno step options.',
  );
  ['ignore', 'sanitizeOps', 'sanitizeResources', 'sanitizeExit'].forEach((key) => {
    assert(!Object.hasOwn(omitted ?? {}, key), `Omitted step policy was materialized: ${key}.`);
  });
});

/**
 * Helpers:
 */
function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertSequence(actual: string[], expected: string[]): void {
  assert(actual.join('\n') === expected.join('\n'), `Unexpected order:\n${actual.join('\n')}`);
}

function captureError(fn: () => void): Error {
  try {
    fn();
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
  throw new Error('Expected function to throw.');
}
