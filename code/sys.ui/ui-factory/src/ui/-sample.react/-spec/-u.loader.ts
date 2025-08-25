import type { Factory, Plan } from '@sys/ui-factory/t';
import type { Sample } from '../-samples/t.ts';

import { type t } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

type R = { plan: Plan<any>; factory: Factory };
type Ctx = Pick<DebugSignals, 'state' | 'props'>;

export async function load(
  ctx: Ctx,
  sample: Sample | undefined = ctx.props.sample.value,
): Promise<R | undefined> {
  const done = (factory: t.Factory, plan: t.Plan): R => ({ factory, plan });

  const p = ctx.props;
  const state = ctx.state;
  const theme = p.theme.value;

  if (sample === 'Hello World') {
    const catalog = await import('../-samples/hello.tsx');
    const { factory, plan } = catalog;
    return done(factory, plan);
  }

  if (sample === 'Slots') {
    const catalog = await import('../-samples/slots.tsx');
    const { factory } = catalog;
    const plan = catalog.makePlan({ theme });
    return done(factory, plan);
  }

  if (sample === 'Factory Error') {
    const catalog = await import('../-samples/fail.tsx');
    const { factory, plan } = catalog;
    return done(factory, plan);
  }

  if (sample === 'State') {
    const catalog = await import('../-samples/state.tsx');
    const { factory } = catalog;
    const plan = catalog.makePlan(state, theme);
    return done(factory, plan);
  }

  if (sample === 'Composed Recursive') {
    const catalog = await import('../-samples/recursive.tsx');
    const depth = 2;
    const { factory, plan } = catalog.makeComposite(undefined, depth, theme);
    return done(factory, plan);
  }

  if (sample === 'Schema Validation') {
    const catalog = await import('../-samples/validation.tsx');
    const { factory } = catalog;
    const invalid = !!p.invalidProps.value;
    const plan = catalog.makePlan(invalid, theme);
    return done(factory, plan);
  }
}
