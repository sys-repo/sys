import type { t } from './common.ts';

export function fromRegs<Id extends string>(
  regs: ReadonlyArray<t.Registration<Id, t.SlotId, unknown>>,
): t.SchemasMap<Id> {
  const out: Record<string, t.TSchema> = {};
  for (const r of regs) {
    const schema = (r.spec as { schema?: t.TSchema }).schema;
    if (schema) out[r.spec.id] = schema;
  }
  return out as t.SchemasMap<Id>;
}
