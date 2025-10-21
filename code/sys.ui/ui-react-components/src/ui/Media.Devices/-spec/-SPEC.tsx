import React from 'react';
import { type t, Dev, Signal, Spec } from '../../-test.ui.ts';

import { D } from '../common.ts';
import { Devices } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe('Devices', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const filter: t.MediaDevicesFilter = (e) => (v.filter ? e.kind === 'videoinput' : true);

    /**
     * Hooks:
     */
    const [items, setItems] = React.useState<MediaDeviceInfo[]>([]);
    Devices.useDeviceSelectionLifecycle({
      enabled: v.debugLocalstorage,
      items,
      storageKey: `dev:${D.displayName}:selected`,
      selected: p.selected.value,
      prefs: { kindOrder: ['videoinput', 'audioinput', 'audiooutput'], requireLabel: true },
      onResolve: (e) => {
        console.info(`⚡️ useDeviceSelectionLifecycle.onResolve:`, e);
        p.selected.value = e.device;
      },
    });

    Signal.useEffect(() => {
      const sel = p.selected.value;
      if (sel) {
        const id = sel.deviceId;
        const short = `${id.slice(0, 5)}..${id.slice(-5)}`;
        console.info('🌼 selection-changed:', sel.kind, `| device-id: ${short}`);
      }
    });

    /**
     * Render:
     */
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
        onDevicesChange={(e) => {
          console.info(`⚡️ List.onDevicesChange:`, e);
          setItems(e.devices);
        }}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    function update() {
      const isNarrow = p.debugNarrow.value;
      ctx.subject.size([isNarrow ? 240 : 400, null]);
      ctx.redraw();
    }
    update(); // Initial.

    Dev.Theme.signalEffect(ctx, p.theme);
    Signal.effect(() => {
      debug.listen();
      update();
    });

    ctx.subject.display('grid').render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
