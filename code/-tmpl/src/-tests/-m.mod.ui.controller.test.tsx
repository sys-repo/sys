import { describe, expect, Fs, it, makeTmpl, type t, Templates } from '../-test.ts';
import { TestReact } from '@sys/ui-react/testing/server';

import { Signal, type t as Template } from '../../-templates/tmpl.m.mod.ui.controller/common.ts';
import { MyCtrl } from '../../-templates/tmpl.m.mod.ui.controller/mod.ts';
import { Controlled } from '../../-templates/tmpl.m.mod.ui.controller/ui.Controlled.tsx';
import { useControlledView } from '../../-templates/tmpl.m.mod.ui.controller/u.controller.ts';
import { makeWorkspaceWithPkg } from './u.ts';

describe('Template: m.mod.ui.controller', () => {
  it('freezes the root and nested UI namespaces', () => {
    expect(Object.isFrozen(MyCtrl)).to.eql(true);
    expect(Object.isFrozen(MyCtrl.UI)).to.eql(true);
    expect(MyCtrl.UI.Controlled).to.equal(Controlled);
  });

  it('materializes a frozen, type-safe module', async () => {
    const test = await makeWorkspaceWithPkg('ns', 'my-module', '@my-scope/foo');
    const name: t.TemplateName = 'm.mod.ui.controller';
    const def = await Templates[name]();
    const targetDir = Fs.join(test.pkgDir, 'src/ui/Button');
    const res = await (await makeTmpl(name)).write(targetDir);
    await def.default(res.dir.target, { name: 'Button' });

    const modText = (await Fs.readText(Fs.join(targetDir, 'mod.ts'))).data ?? '';
    expect(modText).to.include('Object.freeze({');
    expect(modText).to.include('UI: Object.freeze({ Controlled, Uncontrolled })');
  });

  it('useControlledView reflects initial external signal state on first render', async () => {
    function Probe(props: Template.MyCtrl.ControlledProps) {
      const view = useControlledView(props);
      return <div>{JSON.stringify(view)}</div>;
    }

    const debug = Signal.create(true);
    const theme = Signal.create<Template.CommonTheme>('Light');
    const res = await TestReact.render(<Probe debug={debug} theme={theme} />, { strict: false });

    expect(res.container.textContent).to.include('"debug":true');
    expect(res.container.textContent).to.include('"theme":"Light"');

    res.dispose();
  });

  it('Controlled renders on first mount with signal-backed props', async () => {
    const debug = Signal.create(true);
    const theme = Signal.create<Template.CommonTheme>('Light');
    const res = await TestReact.render(<Controlled debug={debug} theme={theme} />, {
      strict: false,
    });

    expect(res.container.textContent?.includes('MyCtrl')).to.eql(true);

    res.dispose();
  });
});
