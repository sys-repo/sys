import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { Signal } from '../common.ts';
import { PropSpinner } from '../-spec/-ui.prop.spinner.tsx';
import { createDebugSignals } from '../-spec/-SPEC.Debug.tsx';

describe('TreeHost spinner choice semantics', () => {
  DomMock.init({ beforeAll, afterAll });

  it('unmatched preset → chosen preset → unmatched retains controlled pressed state', async () => {
    const debug = createDebugSignals();
    const unmatched = { slot: 'main:body', position: 'bottom', backgroundBlur: 7 } as const;
    debug.props.spinner.value = unmatched;
    function Root() {
      Signal.useRedrawEffect(debug.listen);
      return <PropSpinner debug={debug} />;
    }
    const res = await TestReact.render(<Root />);
    try {
      const buttons = () => [...res.container.querySelectorAll<HTMLElement>('li [role="button"]')];
      expect(buttons().length).to.eql(13);
      expect(buttons().every((el) => el.getAttribute('aria-pressed') === 'false')).to.eql(true);
      await React.act(async () => buttons()[0].click());
      expect(debug.props.spinner.value).to.eql(undefined);
      expect(buttons()[0].getAttribute('aria-pressed')).to.eql('true');
      await React.act(async () => {
        debug.props.spinner.value = unmatched;
      });
      expect(buttons().every((el) => el.getAttribute('aria-pressed') === 'false')).to.eql(true);
    } finally {
      React.act(() => res.dispose());
    }
  });
});
