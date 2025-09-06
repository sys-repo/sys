import React from 'react';

import { Crdt } from '@sys/driver-automerge/browser';
import { Lorem } from '../../-test.ui.ts';
import { type t, Button, css, D, Is, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';

export type SampleDoc = { text?: string };
type P = t.TextEditorProps;
type Storage = Pick<
  P,
  'theme' | 'debug' | 'autoFocus' | 'readOnly' | 'scroll' | 'singleLine' | 'path'
>;

export const STORAGE_KEY = { DEV: `dev:${D.name}.docid` };

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

  const defaults: Storage = {
    theme: 'Dark',
    debug: false,

    autoFocus: true,
    readOnly: D.readOnly,
    scroll: false,
    singleLine: true,
    path: ['text'],
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const repo = Crdt.repo({
    storage: { database: 'dev.crdt' },
    network: [{ ws: 'sync.db.team' }],
  });

  const props = {
    redraw: s(0),
    debug: s(snap.debug),
    theme: s(snap.theme),

    readOnly: s<P['readOnly']>(snap.readOnly),
    scroll: s<P['scroll']>(snap.scroll),
    singleLine: s<P['singleLine']>(snap.singleLine),
    autoFocus: s<P['autoFocus']>(snap.autoFocus),

    doc: s<t.Crdt.Ref<SampleDoc>>(),
    path: s<P['path']>(snap.path),
  };
  const p = props;
  const api = {
    props,
    repo,
    localstore: store,
    listen() {
      Object.values(props)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);
    },
  };

  let events: t.Crdt.Events | undefined;
  Signal.effect(() => {
    const doc = p.doc.value;
    events?.dispose();
    events = doc?.events();
    events?.$.subscribe(() => p.redraw.value++);
  });

  Signal.effect(() => {
    store.change((d) => {
      d.debug = p.debug.value;
      d.theme = p.theme.value;
      d.autoFocus = p.autoFocus.value;
      d.readOnly = p.readOnly.value;
      d.scroll = p.scroll.value;
      d.singleLine = p.singleLine.value;
      d.path = p.path.value;
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
      <Button
        block
        label={() => {
          const v = p.path.value;
          return `path: ${v ? `[ ${v} ]` : `<undefined>`}`;
        }}
        onClick={() => {
          Signal.cycle(p.path, [
            undefined,
            ['text'],
            ['foo', 'bar'],
            ['project', 'canvas', 'purpose'],
          ]);
        }}
      />

      <hr />
      <Button
        block
        label={() => `readOnly: ${p.readOnly.value ?? `<undefined> (default: ${D.readOnly})`}`}
        onClick={() => Signal.toggle(p.readOnly)}
      />
      <Button
        block
        label={() => `autoFocus: ${p.autoFocus.value ?? `<undefined> (default: ${D.autoFocus})`}`}
        onClick={() => Signal.toggle(p.autoFocus)}
      />
      <Button
        block
        label={() => `autoFocus: (increment number)`}
        onClick={() => {
          if (Is.bool(p.autoFocus.value)) p.autoFocus.value = -1;
          (p.autoFocus.value as number) += 1;
        }}
      />

      <hr />
      <Button
        block
        label={() => `scroll: ${p.scroll.value ?? `<undefined> (default: ${D.scroll})`}`}
        onClick={() => Signal.toggle(p.scroll)}
      />
      <Button
        block
        label={() => {
          const v = p.singleLine.value;
          return `singleLine: ${v ?? `<undefined> (default: ${D.singleLine})`}`;
        }}
        onClick={() => Signal.toggle(p.singleLine)}
      />

      <hr />
      <div className={Styles.title.class}>{'Samples:'}</div>
      {samplesButtons(debug)}

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView
        name={'debug'}
        data={{ ...Signal.toObject(p), doc: p.doc.value?.current }}
        style={{ marginTop: 10 }}
      />
      <ObjectView name={'doc'} data={p.doc.value?.current} style={{ marginTop: 5 }} expand={0} />
    </div>
  );
};

export function samplesButtons(debug: DebugSignals) {
  const p = debug.props;

  const baseline = () => {
    if (!p.path.value) p.path.value = ['text'];
  };

  return (
    <React.Fragment>
      <Button
        block
        label={() => '- single-line'}
        onClick={() => {
          baseline();
          p.singleLine.value = true;
          p.scroll.value = false;
        }}
      />
      <Button
        block
        label={() => '- multi-line'}
        onClick={() => {
          baseline();
          p.singleLine.value = false;
          p.scroll.value = true;
        }}
      />
      <Button
        block
        label={() => `- long (lorem ipsum)`}
        onClick={() => {
          const doc = p.doc.value;
          const path = p.path.value;
          if (doc && path) doc.change((d) => Obj.Path.Mutate.set(d, path, Lorem.words(500)));
        }}
      />
    </React.Fragment>
  );
}
