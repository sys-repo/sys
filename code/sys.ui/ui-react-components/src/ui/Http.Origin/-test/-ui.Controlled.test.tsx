import {
  afterAll,
  beforeAll,
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
  DomMock.init({ beforeAll, afterAll });

  it('useControlledView reflects initial external signal state on first render', async () => {
    function Probe(props: t.HttpOriginControlledProps) {
      const view = useControlledView({ env: props.env, origin: props.origin, props: { spec: props.spec } });
      return <div>{JSON.stringify({ env: view.env, hasOnChange: typeof view.onChange === 'function' })}</div>;
    }

    const env = Signal.create<t.HttpOriginEnv>('production');
    const res = await TestReact.render(<Probe env={env} spec={Sample.media} />, { strict: false });

    expect(res.container.textContent).to.include('"env":"production"');
    expect(res.container.textContent).to.include('"hasOnChange":true');

    res.dispose();
  });

  it('renders production origin data on first mount with signal-backed env', async () => {
    const env = Signal.create<t.HttpOriginEnv>('production');
    const res = await TestReact.render(<Controlled env={env} spec={Sample.media} />, { strict: false });

    expect(res.container.textContent?.includes('api.example.com')).to.eql(true);
    expect(res.container.textContent?.includes('img.example.com')).to.eql(true);

    res.dispose();
  });
});
