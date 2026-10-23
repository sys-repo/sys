import type { t } from '../common.ts';

import { Type } from '@sys/schema';
import type { TObject, TOptional, TString } from '@sys/schema/t';

/** Domain unions (kept tiny to avoid “slow types”). */
export type Id = 'Hello:view' | 'Panel:view';
export type Slot = never;

/** Export schemas with explicit precise TypeBox types (JSR-friendly, inference-safe). */
export const HelloSchema: TObject<{ name: TString }> = Type.Object({
  name: Type.String({ description: 'Greeting target' }),
});

export const PanelSchema: TObject<{ title: TString; body: TOptional<TString> }> = Type.Object({
  title: Type.String(),
  body: Type.Optional(Type.String()),
});

/** Strong TS types can be inferred on the consumer side:
    type Hello = Infer<typeof HelloSchema>; 
    type Panel = Infer<typeof PanelSchema>;
    (No need to export type aliases unless you want that convenience.)
*/

/** Minimal registrations including `spec.schema` (explicit type, no `satisfies`). */
export const regs: ReadonlyArray<t.ReactRegistration<Id, Slot>> = [
  {
    spec: { id: 'Hello:view', slots: [] as const, schema: HelloSchema },
    load: async () => ({ default: (_: t.Infer<typeof HelloSchema>) => null }),
  },
  {
    spec: { id: 'Panel:view', slots: [] as const, schema: PanelSchema },
    load: async () => ({ default: (_: t.Infer<typeof PanelSchema>) => null }),
  },
];
