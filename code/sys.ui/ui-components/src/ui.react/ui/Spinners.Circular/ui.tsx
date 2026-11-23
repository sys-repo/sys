import { Color, css, D, Is, type t } from './common.ts';

/**
 * Render the scaffold marker until the indicator is implemented.
 */
export const CircularSpinner: t.FC<t.CircularSpinner.Props> = (props) => {
  const { theme, style } = props;
  const color = Is.nil(theme) ? undefined : Color.theme(theme).fg;

  return (
    <span className={css({ color }, style).class} data-component={D.displayName}>
      {D.name} scaffold
    </span>
  );
};
