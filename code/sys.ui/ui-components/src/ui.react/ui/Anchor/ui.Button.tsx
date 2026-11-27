import { useFocusBox } from '../../use.FocusBox.ts';
import { D, type t } from './common.ts';
import { linkAppearance } from './u.linkAppearance.ts';

const reset: t.Style.Value = {
  appearance: 'none',
  overflow: 'visible',
  font: 'inherit',
  padding: 0,
  border: 0,
  background: 'none',
  cursor: 'pointer',
};

export function Button(props: t.Anchor.Button.Props) {
  const appearance = linkAppearance(props, reset);
  const { ref, indicator } = useFocusBox(appearance.compact);
  return (
    <button
      type='button'
      ref={ref}
      className={appearance.class}
      disabled={!(props.enabled ?? D.enabled)}
      title={props.title}
      tabIndex={props.tabIndex}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
      aria-expanded={props['aria-expanded']}
      aria-controls={props['aria-controls']}
      onClick={props.onClick}
    >
      {props.children}
      {indicator}
    </button>
  );
}
