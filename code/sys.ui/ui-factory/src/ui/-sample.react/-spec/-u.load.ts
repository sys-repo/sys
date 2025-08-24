import type { Factory, Plan } from '@sys/ui-factory/t';
import type { Sample } from '../-samples/t.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

type R = { plan: Plan<any>; factory: Factory };
type Ctx = Pick<DebugSignals, 'state' | 'props'>;

export async function load(
  ctx: Ctx,
  sample: Sample | undefined = ctx.props.sample.value,
): Promise<R | undefined> {
  const theme = ctx.props.theme.value;
  const state = ctx.state;

  if (sample === 'Hello World') {
    const { factory, plan } = await import('../-samples/hello.tsx');
    return { factory, plan };
  }

  if (sample === 'Slots') {
    const { factory, makePlan } = await import('../-samples/slots.tsx');
    const plan = makePlan({ theme });
    return { factory, plan };
  }

  if (sample === 'Factory Error') {
    const { factory, plan } = await import('../-samples/fail.tsx');
    return { factory, plan };
  }

  if (sample === 'State') {
    const { factory, makePlan } = await import('../-samples/state.tsx');
    const plan = makePlan(state);
    return { factory, plan };
  }

  if (sample === 'Composed Recursive') {
    const { makeComposite } = await import('../-samples/recursive.tsx');
    const depth = 2;
    const { factory, plan } = makeComposite(undefined, depth, theme);
    return { factory, plan };
  }
}
