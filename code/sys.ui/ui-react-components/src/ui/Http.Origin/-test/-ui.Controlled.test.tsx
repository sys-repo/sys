import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  TestReact,
} from '../../../-test.ts';

import { type t, Signal } from '../common.ts';
import { Sample } from '../-spec/-samples.ts';
import { Controlled } from '../ui.Controlled.tsx';
import { useControlledView } from '../u.controller.ts';

describe('HttpOrigin.UI.Controlled', () => {
  DomMock.init({ beforeEach, afterEach });

  it('useControlledView reflects initial external signal state on first render', async () => {
    function Probe(props: t.HttpOrigin.ControlledProps) {
      const view = useControlledView({ env: props.env, origin: props.origin, props: { spec: props.spec } });
      return <div>{JSON.stringify({ env: view.env, hasOnChange: typeof view.onChange === 'function' })}</div>;
    }

    const env = Signal.create<t.HttpOrigin.Env>('production');
    const res = await TestReact.render(<Probe env={env} spec={Sample.media} />, { strict: false });
    try {
      expect(res.container.textContent).to.include('"env":"production"');
      expect(res.container.textContent).to.include('"hasOnChange":true');
    } finally {
      act(() => res.dispose());
    }
  });

  it('renders production origin data on first mount with signal-backed env', async () => {
    const env = Signal.create<t.HttpOrigin.Env>('production');
    const res = await TestReact.render(<Controlled env={env} spec={Sample.media} />, { strict: false });
    try {
      expect(res.container.textContent?.includes('api.example.com')).to.eql(true);
      expect(res.container.textContent?.includes('img.example.com')).to.eql(true);
    } finally {
      act(() => res.dispose());
    }
  });
});
