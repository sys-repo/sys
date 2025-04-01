import React from 'react';
import { Button } from '../Button/mod.ts';
import { type t, css, DEFAULTS as D, Signal } from './common.ts';

type P = t.ObjProps;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  const s = Signal.create;
  const props = {
    theme: s<P['theme']>('Light'),
    fontSize: s<P['fontSize']>(),
    name: s<P['name']>('my-name'),
    data: s<P['data']>({ msg: '👋', count: 0 }),
    sortKeys: s<P['sortKeys']>(D.sortKeys),
    showNonenumerable: s<t.ObjShow['nonenumerable']>(D.show.nonenumerable),
    showRootSummary: s<t.ObjShow['rootSummary']>(D.show.rootSummary),
  };
  const p = props;
  const api = {
    props,
    get show(): t.ObjShow {
      const nonenumerable = props.showNonenumerable.value;
      const rootSummary = props.showRootSummary.value;
      return { nonenumerable, rootSummary };
    },
    listen() {
      const p = props;
      p.theme.value;
      p.fontSize.value;
      p.data.value;
      p.name.value;
      p.showNonenumerable.value;
      p.showRootSummary.value;
      p.sortKeys.value;
    },
  };
  init?.(api);
  return api;
}

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
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
    cols: css({ display: 'grid', gridTemplateColumns: 'auto 1fr auto' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={css(styles.title, styles.cols).class}>
        <div>{'Obj '}</div>
        <div />
        <div>{'(Object View)'}</div>
      </div>

      <Button
        block
        label={`theme: "${p.theme}"`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={`fontSize: ${p.fontSize ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['fontSize']>(p.fontSize, [undefined, 14, 18, 32])}
      />

      <hr />
      <Button block label={`sortKeys: ${p.sortKeys}`} onClick={() => Signal.toggle(p.sortKeys)} />

      <Button
        block
        label={`showNonenumerable: ${p.showNonenumerable}`}
        onClick={() => Signal.toggle(p.showNonenumerable)}
      />
      <Button
        block
        label={`showRootSummary: ${p.showRootSummary}`}
        onClick={() => Signal.toggle(p.showRootSummary)}
      />

      <hr />
    </div>
  );
};
