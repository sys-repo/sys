import React from 'react';

import { createRepo } from '../../-test.ui.ts';
import { type t, Button, css, D, Is, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';

type P = t.DocumentIdProps;
export const STORAGE_KEY = `dev:${D.name}.input`;

export const sampleUrlFactory: t.DocumentIdUrlFactory = (e) => {
  const url = new URL(location.href);
  url.searchParams.set('my-key', e.docId);
  console.info('⚡️ SAMPLE URL FACTORY:', e, url.href);
  return url.href;
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;
type Storage = {
  controlled?: boolean;
  passRepo?: boolean;
  localstorage?: string;
  url?: boolean | 'ƒ';
  urlKey?: string;
  readOnly?: boolean;
} & Pick<P, 'theme' | 'label' | 'placeholder' | 'autoFocus' | 'enabled'>;

const defaults: Storage = {
  theme: 'Dark',
  autoFocus: D.autoFocus,
  enabled: D.enabled,
  readOnly: D.readOnly,
  passRepo: true,
  controlled: true,
  localstorage: STORAGE_KEY,
  url: true,
  urlKey: D.urlKey,
};

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;

  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    redraw: s(0),
    debug: s(false),
    theme: s(snap.theme),
    passRepo: s(snap.passRepo),
    controlled: s(snap.controlled),
    localstorage: s(snap.localstorage),

    textbox: s<string | undefined>(),
    doc: s<t.CrdtRef>(),
    path: s<t.ObjectPath>(),

    label: s(snap.label),
    placeholder: s(snap.placeholder),
    autoFocus: s(snap.autoFocus),
    enabled: s(snap.enabled),
    readOnly: s(snap.readOnly),

    urlKey: s(snap.urlKey),
    url: s<t.UseDocumentIdHookArgs['url']>(snap.url === 'ƒ' ? sampleUrlFactory : snap.url),
  };
  const p = props;
  const repo = createRepo();
  const api = {
    props,
    repo,
    reset,
    listen() {
      Object.values(p)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.label = p.label.value;
      d.placeholder = p.placeholder.value;
      d.autoFocus = p.autoFocus.value;
      d.passRepo = p.passRepo.value;
      d.enabled = p.enabled.value;
      d.readOnly = p.readOnly.value;
      d.controlled = p.controlled.value;
      d.localstorage = p.localstorage.value;

      const url = p.url.value;
      d.url = Is.func(url) ? 'ƒ' : url;
      d.urlKey = p.urlKey.value;
    });
  });

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

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
        label={() => `label: ${p.label.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.label, [undefined, 'My Descriptive Label', 'Description'])}
      />
      <Button
        block
        label={() => {
          const v = p.placeholder.value;
          return `placeholder: ${Is.string(v) ? v || '""' : `<undefined> (default)`}`;
        }}
        onClick={() => Signal.cycle(p.placeholder, [undefined, 'My Placeholder', ''])}
      />
      <Button
        block
        label={() => `autoFocus: ${p.autoFocus.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.autoFocus)}
      />
      <Button
        block
        label={() => `enabled: ${p.enabled.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.enabled)}
      />
      <Button
        block
        label={() => `readOnly: ${p.readOnly.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.readOnly)}
      />

      <hr />
      <Button
        block
        label={() => `url: ${Is.func(p.url.value) ? 'ƒ' : p.url.value}`}
        onClick={() => Signal.cycle(p.url, [true, false, sampleUrlFactory])}
      />
      <Button
        block
        label={() => `urlKey: ${p.urlKey.value ?? `<undefined> (default: ${D.urlKey})`}`}
        onClick={() => Signal.cycle(p.urlKey, [D.urlKey, 'my-key', undefined])}
      />

      <hr />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => {
          const v = Boolean(p.controlled.value);
          return `controlled: ${v} 🌳 toggle → ${!v} (reload)`;
        }}
        onClick={() => {
          Signal.toggle(p.controlled);
          location.reload();
        }}
      />
      <Button
        block
        label={() => `pass repo: ${p.passRepo.value}`}
        onClick={() => Signal.toggle(p.passRepo)}
      />
      <Button
        block
        label={() => {
          const v = p.localstorage.value;
          return `local-storage: ${v ? `"${v}"` : '(none)'}`;
        }}
        onClick={() => {
          const s = p.localstorage;
          s.value = s.value ? undefined : STORAGE_KEY;
        }}
      />

      <hr />
      <ObjectView name={'debug'} data={wrangle.data(debug)} style={{ marginTop: 10 }} />
      <ObjectView name={'doc'} data={p.doc.value?.current} style={{ marginTop: 10 }} />
      <ObjectView name={'path'} data={p.path.value ?? []} style={{ marginTop: 10 }} />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  data(debug: DebugSignals) {
    const p = debug.props;
    const doc = p.doc.value;
    return Signal.toObject({ ...p, doc: doc?.current });
  },
} as const;
