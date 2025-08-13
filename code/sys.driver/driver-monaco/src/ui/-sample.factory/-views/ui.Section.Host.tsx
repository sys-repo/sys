import { Tree, Button } from '@sys/ui-react-components';
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
  const root = Tree.Index.Data.Yaml.from(data);

  /**
   * Hooks:
   */
  const [path, setPath] = React.useState<t.ObjectPath>();

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
    }),
    body: css({ minWidth: 380 }),
  };

  const elBackButton = (
    <Button
      enabled={() => (path?.length ?? 0) > 0}
      disabledOpacity={0.2}
      style={{ Absolute: [-35, null, null, -35] }}
      theme={theme.name}
      onMouseDown={() => setPath((prev) => (prev ?? []).slice(0, -1))}
    >
      <Icons.Arrow.Left />
    </Button>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks
        theme={theme.name}
        borderOpacity={0.04}
        size={{ mode: 'fill', x: false, y: true, margin: 100 }}
      >
        {elBackButton}
        <Tree.Index.View
          theme={theme.name}
          root={root}
          path={path}
          onPressDown={(e) => {
            if (e.hasChildren) setPath(e.node.path);
          }}
        />
      </Cropmarks>
    </div>
  );
};
