import React from 'react';
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
  documentId: Pick<t.VideoRecorderViewDocumentIdProps, 'visible' | 'readOnly' | 'urlKey'>;
};
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  documentId: { visible: true, readOnly: false, urlKey: undefined },
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
    documentId: {
      visible: s((snap.documentId ?? {}).visible),
      readOnly: s((snap.documentId ?? {}).readOnly),
      urlKey: s((snap.documentId ?? {}).urlKey),
      localstorage: STORAGE_KEY.DEV,
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
    Signal.listen(p);
    Signal.listen(p.documentId);
    Signal.listen(signals);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;

      d.documentId = d.documentId ?? {};
      d.documentId.visible = p.documentId.visible.value;
      d.documentId.readOnly = p.documentId.readOnly.value;
      d.documentId.urlKey = p.documentId.urlKey.value;
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
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
      <ObjectView
        name={doc ? `doc(id:${doc.id.slice(-5)})` : 'doc'}
        data={Obj.trimStringsDeep(doc?.current)}
        style={{ marginTop: 5 }}
        expand={0}
      />
      <ObjectView
        name={'signals'}
        data={{
          camera: simplifyDeviceInfo(signals.camera?.value),
          audio: simplifyDeviceInfo(signals.audio?.value),
        }}
        style={{ marginTop: 5 }}
        expand={1}
      />
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
