import React from 'react';
import { type t, Color, css, D, Obj, rx } from './common.ts';
import { toString } from './u.ts';
import { Filter } from './ui.Filter.tsx';

type P = t.MediaFiltersProps;

/**
 * Component:
 */
export const List: React.FC<P> = (props) => {
  const { debounce = D.debounce } = props;
  const changed$Ref = React.useRef(rx.subject<t.MediaFiltersChangeHandlerArgs>());

  /**
   * Effect: fire debounced 'onChanged' event.
   */
  React.useEffect(() => {
    const life = rx.disposable();
    const $ = changed$Ref.current.pipe(rx.takeUntil(life.dispose$), rx.debounceTime(debounce));
    $.subscribe((e) => props.onChanged?.(e));
    return life.dispose;
  }, [debounce]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    filter: css({ marginBottom: 10, ':last-child': { marginBottom: 0 } }),
  };

  const elRows = Obj.keys(props.values)
    .map((name) => ({ name, value: props.values?.[name] }))
    .map((e, i) => {
      const { name, value } = e;
      const config = wrangle.config(props, name);
      return (
        <Filter
          key={`${name}.${i}`}
          name={name}
          value={value}
          range={config.range}
          unit={config.unit}
          theme={theme.name}
          style={styles.filter}
          onChange={(change) => {
            const values = wrangle.next(props.values, change);
            const filter = toString(values);
            const e: t.MediaFiltersChangeHandlerArgs = { change, filter, values };
            props.onChange?.(e);
            changed$Ref.current.next(e);
          }}
        />
      );
    });

  return <div className={css(styles.base, props.style).class}>{elRows}</div>;
};

/**
 * Helpers:
 */
const wrangle = {
  config(props: P, name: t.MediaFilterName): t.MediaFilterConfig {
    const { config = {} } = props;
    return config[name] ?? D.config[name];
  },

  next(
    prev: Partial<t.MediaFilterValueMap> = {},
    change: t.MediaFilterChangeHandlerArgs,
  ): Partial<t.MediaFilterValueMap> {
    return { ...prev, [change.name]: change.value };
  },
} as const;
