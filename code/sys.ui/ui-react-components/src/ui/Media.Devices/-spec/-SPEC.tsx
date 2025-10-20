import { type t, Dev, Signal, Spec } from '../../-test.ui.ts';

import { D } from '../common.ts';
import { Devices } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe('Devices', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const filter: t.DevicesFilter = (e) => (v.filter ? e.kind === 'videoinput' : true);
    const { items } = Devices.useDevicesList();

    Devices.useDeviceSelectionLifecycle({
      enabled: v.debugLocalstorage,
      items,
      storageKey: `dev:${D.displayName}:selected`,
      selected: p.selected.value,
      prefs: { kindOrder: ['videoinput', 'audioinput', 'audiooutput'], requireLabel: true },
      filter,
      onResolve: (e) => {
        console.info(`⚡️ useDeviceSelectionLifecycle.onResolve:`, e);
        p.selected.value = e.info;
      },
    });

    // Sample: Observe every change.
    Signal.effect(() => {
      const sel = p.selected.value;
      if (sel) console.info('🌼 selection-changed:', sel.kind, `| device: ${sel.deviceId}`);
    });

    return (
      <Devices.UI.List
        debug={v.debug}
        theme={v.theme}
        selected={v.selected}
        rowGap={v.rowGap}
        filter={filter}
        onSelect={(e) => {
          console.info(`⚡️ List.onSelect:`, e);
          p.selected.value = e.info;
        }}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    function updateSize() {
      const isNarrow = p.debugNarrow.value;
      ctx.subject.size([isNarrow ? 240 : 400, null]);
      ctx.redraw();
    }
    updateSize(); // Initial.

    Dev.Theme.signalEffect(ctx, p.theme);
    Signal.effect(() => {
      debug.listen();
      updateSize();
    });

    ctx.subject.display('grid').render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
