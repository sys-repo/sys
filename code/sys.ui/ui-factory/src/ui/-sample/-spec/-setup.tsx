import { Factory, Plan, Renderer } from '@sys/ui-factory/core';
import { ReactHostAdapter } from '@sys/ui-factory/react';
import React from 'react';

import { type t } from '../../-test.ui.ts';
import { pkg } from '../common.ts';

export async function setup() {
  // 1) Local types
  type Id = 'Hello:view';
  type Slot = string; // ← not `never`

  // 2) reg helper (ensure slots typed as Slot[])
  const reg = <TId extends Id>(id: TId) => ({
    spec: { id, slots: [] as Slot[] },
    load: async () => {
      const Comp: React.FC<{ text?: string }> = (props) => (
        <div data-view={id} style={{ padding: 10 }}>
          {props.text ?? 'Hello World'}
        </div>
      );
      (Comp as any).displayName = id;
      return { default: Comp };
    },
  });

  // 3) Setup
  const f = Factory.make<Id>([reg('Hello:view')]) as t.FactoryWithSlots<Id, Slot>;

  const linear: t.LinearPlan<Id, Slot> = {
    root: { id: 'Hello:view', props: { text: `Hello from the "${pkg.name}/react" adapter 🎉` } },
  };

  // Keep generics tight so Id/Slot don’t widen to string
  const canonical = Plan.Linear.toCanonical<Id, Slot, typeof f>(linear, f);
  const resolved = await Plan.resolve<typeof f>(canonical, f);
  if (!resolved.ok) throw resolved.error;

  const adapter = ReactHostAdapter<typeof f>();

  type M = { element: React.JSX.Element };
  const host = Renderer.mount(resolved.root, adapter) as unknown as M;

  return host.element;
}
