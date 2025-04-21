import React, { useState } from 'react';
import { type t, Color, ConceptPlayer, css } from './common.ts';
import { Index } from './ui.Index.tsx';

export type ProgrammeRootProps = t.VideoContentProps & {};

/**
 * Component:
 */
export const ProgrammeRoot: React.FC<ProgrammeRootProps> = (props) => {
  const { state, content } = props;

  const [align, setAlign] = useState<t.ConceptPlayerAlign>('Center');
  const [title, setTitle] = useState<string>();

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      pointerEvents: 'auto', // NB: turn on interactivity (user-input events).
      display: 'grid',
    }),
  };

  const elIndex = (
    <Index
      {...props}
      onModuleSelect={(e) => {
        console.log('e', e);
        setAlign('Right');
        setTitle(e.label);
      }}
    />
  );

  return (
    <div className={css(styles.base).class}>
      <ConceptPlayer
        theme={'Light'}
        columnAlign={align}
        columnVideo={content.video}
        columnBody={elIndex}
        contentTitle={title}
        onBackClick={() => {
          setAlign('Center');
          setTitle(undefined);
        }}
      />
    </div>
  );
};
