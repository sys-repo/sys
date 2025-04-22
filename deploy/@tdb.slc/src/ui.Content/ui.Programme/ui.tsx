import React, { useState } from 'react';
import { type t, App, Color, ConceptPlayer, css, Dom } from './common.ts';
import { MenuList } from './ui.Menu.tsx';

export type ProgrammeRootProps = t.VideoContentProps & {};

/**
 * Component:
 */
export const ProgrammeRoot: React.FC<ProgrammeRootProps> = (props) => {
  const { state, content, is } = props;

  const [align, setAlign] = useState<t.ConceptPlayerAlign>('Center');
  const [title, setTitle] = useState<string>();
  const isCenter = align === 'Center';

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
    <MenuList
      {...props}
      onModuleSelect={(e) => {
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
        onClickOutsideColumn={() => {
          if (isCenter && is.top) state.stack.pop(1);
        onClickOutsideColumn={(e) => {
          // NB: Only clicking outside the column, within the SLC app registeres.
          //     Wider contexts, like say the DevHarness, do not trigger the close/pop action.
          const isWithinApp = Dom.Event.isWithin(e, App.type);
        }}
      />
    </div>
  );
};
