import { type t, Color, css, D } from './common.ts';

export const UI: t.FC<t.Files.InfoPanel.Config.Props> = (props) => {
  const { debug = false } = props;
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 10,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <div>{D.name}</div>
    </div>
  );
};
