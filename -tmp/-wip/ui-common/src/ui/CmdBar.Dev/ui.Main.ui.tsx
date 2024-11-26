import { Color, css, type t } from './common.ts';
import { ArgsCard } from './ui.Main.ArgsCard.tsx';
import { Run } from './ui.Main.Run.tsx';

export const View: React.FC<t.MainProps> = (props) => {
  const fields = wrangle.fields(props);

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: wrangle.gridTemplateRows(props),
    }),
    row: css({
      position: 'relative',
      display: 'grid',
    }),
    argsCard: css({ marginTop: 50, marginBottom: 60 }),
  };

  const elements = fields.map((field, i) => {
    const key = `${field}.${i}`;

    if (field === 'Module.Args') {
      const t = props.argsCard?.theme ?? theme.name;
      return (
        <div key={key} {...styles.row}>
          <ArgsCard key={key} {...props.argsCard} theme={t} style={styles.argsCard} />
        </div>
      );
    }

    if (field === 'Module.Run') {
      const t = props.run?.theme ?? theme.name;
      return (
        <div key={key} {...styles.row}>
          <Run {...props.run} theme={t} />
        </div>
      );
    }

    return null;
  });

  return <div {...css(styles.base, props.style)}>{elements}</div>;
};

/**
 * Helpers
 */
const wrangle = {
  fields(props: t.MainProps) {
    return (props.fields ?? []).filter(Boolean);
  },

  gridTemplateRows(props: t.MainProps) {
    const fields = wrangle.fields(props);
    return fields
      .map((field) => {
        if (field === 'Module.Args') return 'auto';
        if (field === 'Module.Run') return '1fr';
        return;
      })
      .filter(Boolean)
      .join(' ');
  },
} as const;
