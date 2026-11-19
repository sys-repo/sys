import React from 'react';
import { DomMock } from '@sys/testing/server/dom';
import { act, TestReact } from '@sys/ui-react/testing/server';
import { afterAll, beforeAll, describe, expect, it } from '../../../../-test.ts';
import { ActionProbe, type t } from '../common.ts';
import { CardKindsList } from '../ui/ui.CardKindsList.tsx';
import { renderTreeRefSelector } from '../-spec.cards/-u.treeRefSelector.tsx';

describe('Data card choice boundaries', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const kind of ['card', 'ref']) {
    it(`${kind}: absent → selected → cleared retains pressed-button semantics`, async () => {
      let clear!: () => void;
      const selectedIds: string[] = [];
      function Root() {
        const [selected, update] = React.useState<t.HttpDataCards.DataCardKind>();
        clear = () => update(undefined);
        if (kind === 'card') {
          return <CardKindsList.UI selected={selected} onKindSelect={({ id }) => update(id)} />;
        }
        const spec: t.ActionProbe.ProbeSpec<t.HttpDataCards.TEnv> = {
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
          <ActionProbe.Probe spec={spec} env={{ origin: 'https://example.com', dataset: 'test' }} />
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
