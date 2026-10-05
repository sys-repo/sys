import { describe, expectTypeOf, it } from './mod.ts';
import type { Bdd } from './t.Bdd.ts';

type DenoTopLevelPolicy = Pick<Deno.TestDefinition, keyof Bdd.TestOptions>;
type DenoStepPolicy = Pick<Deno.TestStepDefinition, keyof Bdd.StepOptions>;

describe('BDD type contracts', () => {
  it('exactly match deliberately owned Deno policy keys', () => {
    const topLevel = {} as Bdd.TestOptions;
    const step = {} as Bdd.StepOptions;
    expectTypeOf(topLevel).toEqualTypeOf<DenoTopLevelPolicy>();
    expectTypeOf(step).toEqualTypeOf<DenoStepPolicy>();
  });
});

function compileRegistrationContracts() {
  type State = { count: number };

  const suite = describe<State>({
    name: 'typed suite',
    beforeEach() {
      this.count = 1;
    },
  });

  describe(suite, 'nested suite', { sanitizeOps: false }, () => undefined);
  it(suite, 'typed test', { sanitizeResources: false }, function (context) {
    expectTypeOf(this.count).toEqualTypeOf<number>();
    expectTypeOf(context).toEqualTypeOf<Deno.TestContext>();
  });
  it(suite, 'nested runtime permission error', { permissions: 'none' }, () => undefined);
  it(suite, 'nested runtime timeout error', { timeout: 1 }, () => undefined);

  describe.skip('body-less skipped suite');
  describe.todo('body-less todo suite');
  it.skip('body-less skipped test');
  it.todo('body-less todo test');

  // @ts-expect-error Deno retry orchestration is an explicit adapter non-goal
  describe('unsupported suite retry', { retry: 2 }, () => undefined);

  // @ts-expect-error Deno repeats orchestration is an explicit adapter non-goal
  it('unsupported test repeats', { repeats: 2 }, () => undefined);
}

void compileRegistrationContracts;
