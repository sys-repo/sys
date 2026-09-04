import { Plan, Renderer } from '../m.core/mod.ts';

import type { t } from './common.ts';
import { HostAdapter } from './m.HostAdapter.ts';

export async function renderPlan<F extends t.ReactFactory<any, any>>(
  plan: t.Plan<F>,
  factory: F,
): Promise<React.ReactElement> {
  const resolved = await Plan.resolve(plan, factory);
  if (!resolved.ok) throw resolved.error;
  const inst = Renderer.mount(resolved.root, HostAdapter);
  return (inst as { element: React.ReactElement }).element;
}
