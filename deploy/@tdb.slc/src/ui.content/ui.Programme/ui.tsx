import React, { useState } from 'react';
import { type t, App, Color, ConceptPlayer, css, Dom, Signal } from './common.ts';
import { RootMenu } from './ui.RootMenu.tsx';
import { Section } from './ui.Section.tsx';

export type ProgrammeRootProps = t.VideoContentProps & {};

/**
 * Component:
 */
export const ProgrammeRoot: React.FC<ProgrammeRootProps> = (props) => {
  const { state, is, content } = props;
  const debug = state.props.debug.value ?? false;

  const [align, setAlign] = useState<t.ConceptPlayerAlign>('Center');
  const [media, setMedia] = useState<t.VideoMediaContent>();

  const isCenter = align === 'Center';
  const title = media?.title ?? 'Untitled';

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => {
    state.props.debug.value;
  });

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
    <RootMenu
      {...props}
      debug={debug}
      onSelect={(e) => {
        setAlign('Right');
        setMedia(e.item);
      }}
    />
  );

  const elSection = media && <Section media={media} />;

  return (
    <div className={css(styles.base).class}>
      <ConceptPlayer
        theme={'Light'}
        columnAlign={align}
        columnVideo={content.media?.video}
        columnBody={isCenter ? elRootMenu : elSection}
        contentTitle={title}
        onBackClick={() => {
          setAlign('Center');
          setMedia(undefined);
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
