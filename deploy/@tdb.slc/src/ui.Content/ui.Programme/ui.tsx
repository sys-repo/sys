import React, { useState } from 'react';
import { type t, App, Color, ConceptPlayer, css, Dom } from './common.ts';
import { MenuList } from './ui.Menu.tsx';
import { Section } from './ui.Section.tsx';

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

  const elRootMenu = (
    <MenuList
      {...props}
      onModuleSelect={(e) => {
        setAlign('Right');
        setTitle(e.label);
      }}
    />
  );

  const elSection = <Section />;

  return (
    <div className={css(styles.base).class}>
      <ConceptPlayer
        theme={'Light'}
        columnAlign={align}
        columnVideo={content.video}
        columnBody={isCenter ? elRootMenu : elSection}
        contentTitle={title}
        onBackClick={() => {
          setAlign('Center');
          setTitle(undefined);
        }}
        onClickOutsideColumn={(e) => {
          // NB: Only clicking outside the column, within the SLC app registeres.
          //     Wider contexts, like say the DevHarness, do not trigger the close/pop action.
          const isWithinApp = Dom.Event.isWithin(e, App.type);
          if (isWithinApp && isCenter && is.top) state.stack.pop();
        }}
      />
    </div>
  );
};
