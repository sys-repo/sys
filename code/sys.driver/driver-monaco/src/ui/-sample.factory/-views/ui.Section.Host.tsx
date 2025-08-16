import { Button, Tree } from '@sys/ui-react-components';
import React from 'react';
import { type t, Color, Cropmarks, css, Icons } from '../common.ts';

type O = Record<string, unknown>;

export type SectionHostProps = {
  data?: O;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const SectionHost: React.FC<SectionHostProps> = (props) => {
  const { data = {} } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
    body: css({ minWidth: 380 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks
        theme={theme.name}
        borderOpacity={0.04}
        size={{ mode: 'fill', x: false, y: true, margin: 100 }}
      >
        <IndexTree data={data} theme={theme.name} />
      </Cropmarks>
    </div>
  );
};

/**
 * Tree
 */
export type IndexTreeProps = {
  data?: O;
  debug?: boolean;
  theme?: t.CommonTheme;
  outerTheme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const IndexTree: React.FC<IndexTreeProps> = (props) => {
  const { data = {} } = props;
  const root = wrangle.root(data);
  const outerTheme = Color.theme(props.outerTheme ?? props.theme);

  /**
   * Hooks:
   */
  const [path, setPath] = React.useState<t.ObjectPath>();

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    backButton: css({ Absolute: [-35, null, null, -35] }),
  };

  const elBackButton = (
    <Button
      enabled={() => (path?.length ?? 0) > 0}
      disabledOpacity={0.2}
      style={styles.backButton}
      theme={outerTheme.name}
      onMouseDown={() => setPath((prev) => (prev ?? []).slice(0, -1))}
    >
      <Icons.Arrow.Left />
    </Button>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elBackButton}
      <Tree.Index.View
        theme={theme.name}
        root={root}
        path={path}
        onPressDown={(e) => {
          if (e.hasChildren) setPath(e.node.path);
          // console.info(`⚡️ Tree.Index.View.onPressDown:`, e);
          // if (e.is.down) {
          // }
        }}
      />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  root(input?: O) {
    try {
      return Tree.Index.Data.Yaml.from(input ?? {});
    } catch (error) {
      return undefined;
    }
  },
} as const;
