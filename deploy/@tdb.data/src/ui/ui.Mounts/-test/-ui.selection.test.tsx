import React from 'react';
import { DomMock } from '@sys/testing/server/dom';
import { act, TestReact } from '@sys/ui-react/testing/server';
import { afterAll, beforeAll, describe, expect, it } from '../../../-test.ts';
import { type t, Time } from '../common.ts';
import { Mounts } from '../mod.ts';
import { SlugMounts } from '../../../m/m.Mounts/mod.ts';

const transport: t.SlugLoadTransport = {
  policy: {
    maxBytes: 1024,
    timeout: 1000,
    maxRedirects: 0,
    progressInterval: 25,
    sourceOrigins: ['https://example.com'],
    credentialOrigins: [],
  },
};

describe('Mounts selection boundary', () => {
  DomMock.init({ beforeAll, afterAll });

  it('clear → select → clear retains choice semantics without changing controller policy', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () =>
      Promise.resolve(
        new Response(
          SlugMounts.stringify({ mounts: [{ mount: 'a' }, { mount: 'b' }] }),
          { headers: { 'content-type': 'application/json' } },
        ),
      );
    let update!: (id: string | undefined) => void;
    const selections: string[] = [];
    function Root() {
      const [selected, setSelected] = React.useState<string | undefined>('a');
      update = setSelected;
      return (
        <Mounts.UI
          {...transport}
          origin='https://example.com/data/'
          selected={selected}
          onSelect={(id) => selections.push(id)}
        />
      );
    }
    try {
      const res = await TestReact.render(<Root />);
      try {
        await act(async () => {
          await Time.wait(0);
        });
        const states = () =>
          [...res.container.querySelectorAll('li [role="button"]')]
            .map((el) => el.getAttribute('aria-pressed'));
        expect(states()).to.eql(['true', 'false']);
        await act(async () => update(undefined));
        expect(states()).to.eql(['false', 'false']);
        await act(async () =>
          res.container.querySelectorAll<HTMLElement>('li [role="button"]')[1].click()
        );
        expect(states()).to.eql(['false', 'true']);
        expect(selections).to.eql(['b']);
        await act(async () => update('a'));
        await act(async () => update(undefined));
        expect(states()).to.eql(['false', 'false']);
      } finally {
        act(() => res.dispose());
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
