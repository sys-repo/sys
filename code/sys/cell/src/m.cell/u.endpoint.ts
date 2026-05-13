import type { t } from './common.ts';

/** Resolve the named endpoint selected by a task/service descriptor. */
export function endpointNameOf(ref: t.Cell.EndpointSelector): string {
  return ref.use;
}
