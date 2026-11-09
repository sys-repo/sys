import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { type t } from '../common.ts';
import { ActionProbe } from '../mod.ts';
import { BulletList } from '../../BulletList/mod.ts';
import { key } from '../../Button/-test/u.fixture.ts';

type Env = { ref: string; select: (id: string) => void };

describe('ActionProbe nested activation ownership', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const input of ['Enter', ' ']) {
    it(`${input} on B → select and run B once, without an obsolete A run`, async () => {
      const pending = Promise.withResolvers<void>();
      const runs: string[] = [];
      const selections: string[] = [];
      let current = 'A';
      const spec: t.ActionProbe.ProbeSpec<Env> = {
        title: 'Reference',
        render(e) {
          e.element(
            <BulletList.UI
              items={[{ id: 'A' }, { id: 'B' }]}
              selected={e.ref}
              onActivate={({ id }) => {
                selections.push(id);
                e.select(id);
              }}
            />,
          );
        },
        async run(e) {
          runs.push(e.ref);
          await pending.promise;
          // Model a request that publishes its captured reference after completing.
          e.select(e.ref);
        },
      };
      function Root() {
        const [ref, select] = React.useState('A');
        current = ref;
        return (
          <ActionProbe.Probe spec={spec} env={{ ref, select }} runRequest={ref} actOn='Enter' />
        );
      }
      const res = await TestReact.render(<Root />);
      try {
        const choice = res.container.querySelectorAll<HTMLElement>('li [role="button"]')[1];
        React.act(() => choice.focus());
        await React.act(async () => {
          key(choice, 'keydown', input);
          key(choice, 'keydown', input, { repeat: true });
          key(choice, 'keyup', input);
        });
        expect(selections).to.eql(['B']);
        expect(current).to.eql('B');
        expect(runs).to.eql(['B']);
        await React.act(async () => {
          pending.resolve();
          await pending.promise;
        });
        expect(current).to.eql('B');
        expect(runs).to.eql(['B']);

        // A consumed repeat must not turn into an ancestor run after completion.
        key(choice, 'keydown', input, { repeat: true });
        key(choice, 'keyup', input);
        expect(runs).to.eql(['B']);

        const root = res.container.querySelector<HTMLElement>('[data-component]')!;
        React.act(() => root.focus());
        await React.act(async () => {
          key(root, 'keydown', 'Enter');
          key(root, 'keyup', 'Enter');
        });
        expect(runs).to.eql(['B', 'B']);
      } finally {
        await React.act(async () => {
          pending.resolve();
          await pending.promise;
        });
        React.act(() => res.dispose());
      }
    });
  }
});
