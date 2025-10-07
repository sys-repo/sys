import React from 'react';

import { BinaryFile } from '@sys/driver-automerge/web/ui';
import type { FileshareSchema } from '../-schemas/mod.ts';
import { type t, Color, Crdt, Cropmarks, css, Is } from '../common.ts';

export type FileshareHostProps = {
  data?: FileshareSchema;
  repo?: t.CrdtRepo;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const FileshareHost: React.FC<FileshareHostProps> = (props) => {
  const { repo, data } = props;
  const debug = data?.debug ?? false;
  const path = wrangle.path(data?.path);

  const { doc, error } = Crdt.UI.useDoc(repo, data?.doc);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    body: css({
      minWidth: 550,
      minHeight: 450,
      display: 'grid',
    }),
  };

  const elBody = (
    <div className={styles.body.class}>
      <BinaryFile theme={theme.name} doc={doc} path={path} debug={debug} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.04}>
        {elBody}
      </Cropmarks>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  path(input?: FileshareSchema['path']): t.ObjectPath | undefined {
    if (!input) return undefined;
    if (Is.string(input)) return input.split('/');
    return input;
  },
} as const;
