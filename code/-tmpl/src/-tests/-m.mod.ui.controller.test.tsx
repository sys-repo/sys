import { describe, expect, it } from '../-test.ts';
import { TestReact } from '@sys/ui-react/testing/server';

import { type t, Signal } from '../../-templates/tmpl.m.mod.ui.controller/common.ts';
import { Controlled } from '../../-templates/tmpl.m.mod.ui.controller/ui.Controlled.tsx';
import { useControlledView } from '../../-templates/tmpl.m.mod.ui.controller/u.controller.ts';

describe('Template: m.mod.ui.controller', () => {
  it('useControlledView reflects initial external signal state on first render', async () => {
    function Probe(props: t.MyCtrlControlledProps) {
      const view = useControlledView(props);
      return <div>{JSON.stringify(view)}</div>;
    }

    const debug = Signal.create(true);
    const theme = Signal.create<t.CommonTheme>('Light');
    const res = await TestReact.render(<Probe debug={debug} theme={theme} />, { strict: false });

    expect(res.container.textContent).to.include('"debug":true');
    expect(res.container.textContent).to.include('"theme":"Light"');

    res.dispose();
  });

  it('Controlled renders on first mount with signal-backed props', async () => {
    const debug = Signal.create(true);
    const theme = Signal.create<t.CommonTheme>('Light');
    const res = await TestReact.render(<Controlled debug={debug} theme={theme} />, { strict: false });

    expect(res.container.textContent?.includes('MyCtrl')).to.eql(true);

    res.dispose();
  });
});
