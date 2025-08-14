import React from 'react';
import { createRepo } from '../../-test.ui.ts';
import { type t, Button, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';

type P = t.YamlEditorFooterProps;
type Storage = Pick<P, 'theme' | 'debug' | 'visible' | 'path'> & {
  errors?: t.Json;
  crdt: Omit<t.YamlEditorFooterCrdt, 'repo'> & { repo?: boolean };
};
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  errors: undefined,
  visible: D.visible,
  path: ['foo', 'bar', 0],
  crdt: { visible: true, repo: true },
};

const SAMPLE = {
  errors: [
    {
      name: 'YAMLParseError',
      code: 'BAD_SCALAR_START',
      message: `Plain value cannot start with reserved character @ at line 2, column 6:\n\nfoo: @foo\n     ^\n`,
      pos: [6, 7],
      linePos: [
        { line: 2, col: 6 },
        { line: 2, col: 7 },
      ],
    },
  ] satisfies t.YamlError[],
} as const;

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

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    errors: s(snap.errors as t.YamlError[] | undefined),
    visible: s(snap.visible),
    path: s(snap.path),
    crdt: {
      visible: s(snap.crdt.visible),
      repo: s(snap.crdt.repo),
    },
  };
  const p = props;
  const api = {
    props,
    repo: createRepo(),
    listen() {
      Signal.listen(props, true);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.visible = p.visible.value;
      d.path = p.path.value;
      d.errors = p.errors.value as t.Json | undefined;
      d.crdt.repo = p.crdt.repo.value;
      d.crdt.visible = p.crdt.visible.value;
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
        label={() => `visible: ${p.visible.value ?? `<undefined> (default: ${D.visible})`}`}
        onClick={() => Signal.toggle(p.visible)}
      />

      <hr />
      <Button
        block
        label={() => `path: ${p.path.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.path, [['foo'], ['foo', 'bar', 0], undefined])}
      />
      <Button
        block
        label={() => {
          const v = p.errors.value;
          return `errors: ${v ? `array[${v.length}]` : `<undefined>`}`;
        }}
        onClick={() => Signal.cycle(p.errors, [SAMPLE.errors, undefined])}
      />

      <hr />
      <Button
        block
        label={() => `crdt.repo: ${p.crdt.repo.value ? '(passing)' : '(not passed)'}`}
        onClick={() => Signal.toggle(p.crdt.repo)}
      />
      <Button
        block
        label={() => `crdt.visible: ${p.crdt.visible.value}`}
        onClick={() => Signal.toggle(p.crdt.visible)}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `(reset)`}
        onClick={() => Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)))}
      />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};
