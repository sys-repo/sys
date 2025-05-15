import React from 'react';
import { type t, Color, css, rx } from './common.ts';
import { Filter } from './ui.Filter.tsx';

/**
 * Component:
 */
export const Filters: React.FC<t.FiltersProps> = (props) => {
  const {} = props;

  type S = [number, React.Dispatch<React.SetStateAction<number>>];
  const brightness = React.useState(100);
  const contrast = React.useState(100);
  const saturate = React.useState(100);

  const changedRef = React.useRef(rx.subject<string>());

  /**
   * Effects
   */
  React.useEffect(() => {
    let filter = '';
    filter += ` brightness(${brightness[0].toFixed(1)}%)`;
    filter += ` contrast(${contrast[0].toFixed(1)}%)`;
    filter += ` saturate(${saturate[0].toFixed(1)}%)`;
    filter = filter.trim();
    changedRef.current.next(filter);
  }, [brightness[0], contrast[0], saturate[0]]);

  React.useEffect(() => {
    const life = rx.lifecycle();
    const $ = changedRef.current.pipe(rx.takeUntil(life.dispose$), rx.debounceTime(250));
    $.subscribe((filter) => props.onChange?.({ filter }));
    return life.dispose;
  }, []);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    filter: css({
      marginBottom: 10,
      ':last-child': { marginBottom: 0 },
    }),
  };

  const filter = (label: string, min: number, max: number, unit: string, state: S) => {
    return (
      <Filter
        label={label}
        value={state[0]}
        min={min}
        max={max}
        unit={unit}
        theme={theme.name}
        style={styles.filter}
        onChange={(e) => state[1](e.value)}
      />
    );
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {filter('brightness', 0, 200, '%', brightness)}
      {filter('contrast', 0, 200, '%', contrast)}
      {filter('saturate', 0, 200, '%', saturate)}
    </div>
  );
};
