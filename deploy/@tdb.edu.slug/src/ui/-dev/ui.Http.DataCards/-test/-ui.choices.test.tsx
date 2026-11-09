import React from 'react';
import { DomMock } from '@sys/testing/server/dom';
import { act, TestReact } from '@sys/ui-react/testing/server';
import { afterAll, beforeAll, describe, expect, it } from '../../../../-test.ts';
import { ActionProbe } from '../common.ts';
import { type t } from '../-spec.cards/common.ts';
import { CardKindsList } from '../ui/ui.CardKindsList.tsx';
import { renderTreeRefSelector } from '../-spec.cards/-u.treeRefSelector.tsx';

describe('Data card choice boundaries', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const kind of ['card', 'ref']) {
    it(`${kind}: absent → selected → cleared retains pressed-button semantics`, async () => {
      let clear!: () => void;
      const selectedIds: string[] = [];
      function Root() {
        const [selected, update] = React.useState<t.DataCardKind>();
        clear = () => update(undefined);
        if (kind === 'card') {
          return (
            <CardKindsList.UI
              kinds={['file-content', 'playback-content']}
              selected={selected}
              onKindSelect={({ id }) => update(id)}
            />
          );
        }
        const spec: t.ActionProbe.ProbeSpec<t.TEnv> = {
          title: 'Refs',
          render(e) {
            renderTreeRefSelector(e, {
              selected,
              refs: ['file-content', 'playback-content'],
              onSelect(id) {
                selectedIds.push(id);
                if (id === 'file-content' || id === 'playback-content') update(id);
              },
            });
          },
        };
        return (
          <ActionProbe.Probe
            spec={spec}
            env={{
              is: { local: false },
              origin: {
                app: 'https://example.com',
                cdn: { default: 'https://example.com', video: 'https://example.com' },
              },
            }}
          />
        );
      }
      const res = await TestReact.render(<Root />);
      try {
        const states = () =>
          [...res.container.querySelectorAll('li [role="button"]')]
            .map((el) => el.getAttribute('aria-pressed'));
        expect(states()).to.eql(['false', 'false']);
        act(() => res.container.querySelector<HTMLElement>('li [role="button"]')!.click());
        expect(states()).to.eql(['true', 'false']);
        act(clear);
        expect(states()).to.eql(['false', 'false']);
        if (kind === 'ref') expect(selectedIds).to.eql(['file-content']);
      } finally {
        act(() => res.dispose());
      }
    });
  }
});
