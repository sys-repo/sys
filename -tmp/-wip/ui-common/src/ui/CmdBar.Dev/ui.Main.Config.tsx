import { useEffect, useState } from 'react';
import { PropList } from '../PropList/mod.ts';
import { Color, css, DEFAULTS, rx, type t } from './common.ts';

export const Config: React.FC<t.MainConfigProps> = (props) => {
  const { state, useStateController } = props;
  const fields = state?.current.fields;

  const [, setRedraw] = useState(0);
  const redraw = () => setRedraw((n: number) => n + 1);

  /**
   * Lifecycle
   */
  useEffect(() => {
    const events = state?.events();
    if (state && useStateController && events) {
      events.changed$.pipe(rx.debounceTime(50)).subscribe(redraw);
    }
    return events?.dispose;
  }, [state?.instance, useStateController]);

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      {props.title && <PropList title={props.title} margin={[0, 0, 10, 0]} />}
      <PropList.FieldSelector
        all={DEFAULTS.Main.fields.all}
        defaults={DEFAULTS.Main.fields.default}
        selected={fields}
        onClick={(event) => {
          const { value } = event.as<t.MainField>();
          state?.change((d) => (d.fields = value.next));
        }}
      />
    </div>
  );
};
