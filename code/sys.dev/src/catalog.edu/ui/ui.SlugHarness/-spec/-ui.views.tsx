import React from 'react';
import { type t, Button, Color, css, Obj, Signal } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';
import { PATH } from './-u.ts';

export type SlugViewsProps = {
  debug: DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

const Path = Obj.Path;

/**
 * Component:
 */
export const SlugViews: React.FC<SlugViewsProps> = (props) => {
  const { debug } = props;
  const registry = debug.registry;
  const p = debug.props;
  const doc = debug.signals.doc.value;
  const isCurrent = (id: t.StringId) => p.main.value === id;

  /**
   * Handlers:
   */
  function handleClick(item?: t.SlugViewRegistryItem) {
    doc?.change((d) => {
      Path.Mutate.ensure(d, PATH.dev, {});
      Path.Mutate.set(d, Path.join(PATH.dev, PATH.main), item?.id ?? null);
      // Path.Mutate.set(d, Path.join(PATH.dev, PATH.main), null);
    });
  }

  /**
   * Effects:
   */
  Signal.useRedrawEffect(debug.listen);
  React.useEffect(() => {
    if (!doc) return;

    const events = doc.events();
    events.path(PATH.dev).$.subscribe((e) => {
      const main = Path.get<string>(e.after, Path.join(PATH.dev, PATH.main));
      console.log('main', main);
      p.main.value = main || undefined;
    });

    return events.dispose;
    //
  }, [doc?.id, doc?.instance]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
    }),
  };

  const elButtons = registry.list().map((item, i) => {
    const id = item.id;
    return (
      <Button
        key={`${i}.${id}`}
        block
        label={() => `main: ${id} ${isCurrent(id) ? '🌳' : ''}`}
        onClick={() => handleClick(item)}
      />
    );
  });

  return (
    <div className={css(styles.base, props.style).class}>
      {elButtons}
      {/* <Button block label={() => `(none)`} onClick={() => (p.main.value = undefined)} /> */}
      <Button block label={() => `(none)`} onClick={() => handleClick(undefined)} />
    </div>
  );
};
