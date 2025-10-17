import React from 'react';
import { SignalsObjectView } from '../-dev/ui.SignalsObjectView.tsx';
import { createRepo } from '../../-test.ui.ts';
import {
  type t,
  Button,
  css,
  D,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
  STORAGE_KEY,
  Str,
} from '../common.ts';

type P = t.VideoRecorderViewProps;
type Storage = Pick<P, 'theme' | 'debug'> & {
  header: Pick<t.CrdtLayoutHeaderConfig, 'visible' | 'readOnly' | 'urlKey'>;
  sidebar: t.CrdtLayoutSidebarConfig;
};
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  header: D.header,
  sidebar: D.sidebar,
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const signals: P['signals'] = {
    doc: s<t.Crdt.Ref>(),
    camera: s<MediaDeviceInfo>(),
    audio: s<MediaDeviceInfo>(),
  };

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    header: {
      visible: s((snap.header ?? {}).visible),
      readOnly: s((snap.header ?? {}).readOnly),
      urlKey: s((snap.header ?? {}).urlKey),
      localstorage: STORAGE_KEY.DEV,
    },
    sidebar: {
      visible: s((snap.sidebar ?? {}).visible),
      position: s((snap.sidebar ?? {}).position),
      width: s((snap.sidebar ?? {}).width),
    },
  };

  const p = props;
  const api = {
    props,
    repo: createRepo(),
    signals,
    reset,
    listen,
  };

  function listen() {
    Signal.listen(p, true);
    Signal.listen(signals);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;

      d.header = d.header ?? {};
      d.header.visible = p.header.visible.value;
      d.header.readOnly = p.header.readOnly.value;
      d.header.urlKey = p.header.urlKey.value;

      d.sidebar = d.sidebar ?? {};
      d.sidebar.visible = p.sidebar.visible.value;
      d.sidebar.position = p.sidebar.position.value;
      d.sidebar.width = p.sidebar.width.value;
    });
  });

  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
};

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const signals = debug.signals;
  const doc = signals.doc?.value;
  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button
        block
        label={() => `header.visible: ${p.header.visible.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.header.visible)}
      />
      <Button
        block
        label={() => `header.readOnly: ${p.header.readOnly.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.header.readOnly)}
      />
      <Button
        block
        label={() => `header.urlKey: ${p.header.urlKey.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.header.urlKey, ['foo', undefined])}
      />

      <hr />
      <Button
        block
        label={() => `sidebar.visible: ${p.sidebar.visible.value}`}
        onClick={() => Signal.toggle(p.sidebar.visible)}
      />
      <Button
        block
        label={() => `sidebar.position: ${p.sidebar.position.value}`}
        onClick={() => Signal.cycle(p.sidebar.position, ['left', 'right'])}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <ObjectView
        name={doc ? `doc(id:"${doc.id.slice(-5)}")` : 'doc'}
        data={Obj.trimStringsDeep(doc?.current)}
        style={{ marginTop: 5 }}
        expand={0}
      />
      <SignalsObjectView signals={signals} style={{ marginTop: 5 }} />
    </div>
  );
};

function simplifyDeviceInfo(device?: MediaDeviceInfo) {
  if (!device) return;
  return Obj.trimStringsDeep(
    {
      deviceId: device.deviceId,
      kind: device.kind,
      label: device.label,
      groupId: device.groupId,
    },
    20,
  );
}
