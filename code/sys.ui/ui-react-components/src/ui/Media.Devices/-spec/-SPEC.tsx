import { type t, Dev, Signal, Spec } from '../../-test.ui.ts';

import { D, Str } from '../common.ts';
import { Devices } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe('Devices', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const filter: t.MediaDevicesFilter = (e) => (v.filter ? e.kind === 'videoinput' : true);
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
        p.selected.value = e.device;
      },
    });

    // Sample: Observe every change.
    Signal.useEffect(() => {
      const sel = p.selected.value;
      if (sel) {
        const id = sel.deviceId;
        const short = `${id.slice(0, 5)}..${id.slice(-5)}`;
        console.info('🌼 selection-changed:', sel.kind, `| device-id: ${short}`);
      }
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
          p.selected.value = e.device;
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
