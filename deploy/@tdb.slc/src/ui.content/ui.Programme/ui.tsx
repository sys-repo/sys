import React from 'react';
import { type t, App, Color, ConceptPlayer, css, Dom, Signal } from './common.ts';
import { Menu } from './ui.Column.Menu.tsx';
import { Section } from './ui.Column.Section.tsx';
import { Timestamps } from './ui.Timestamps.tsx';
import { useProgrammeController } from './use.Programme.Controller.ts';

/**
 * Component:
 */
export const Programme: React.FC<t.ProgrammeProps> = (props) => {
  const { state, isTop } = props;

  const p = state.component?.props;
  const debug = p?.debug.value;
  const align = p?.align.value;
  const isCenter = align === 'Center';

  /**
   * State controller.
   */
  const controller = useProgrammeController(state.component);

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => state.component.listen());

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
    <Menu
      //
      debug={debug}
      media={controller.media}
      onSelect={(e) => controller.onSelectSection(e.index)}
    />
  );

  const player = controller.section.player;
  const elSection = controller.section.media && (
    <Section
      debug={debug}
      media={controller.section.media.section}
      selected={controller.section.index.child}
      onSelect={(e) => controller.section.onSelectChild(e.index)}
    />
  );

  const elTimestamps = controller.section.media && (
    <Timestamps timestamps={controller.section.media.root?.timestamps} player={player} />
  );

  return (
    <div className={css(styles.base).class}>
      <ConceptPlayer
        debug={debug}
        theme={'Light'}
        columnAlign={align}
        columnVideo={player}
        columnBody={isCenter ? elRootMenu : elSection}
        contentTitle={controller.section.title}
        contentBody={elTimestamps}
        onBackClick={() => controller.onBackClick()}
        onClickOutsideColumn={(e) => {
          // NB: Only clicking outside the column but within the SLC app.
          //     Wider contexts, like say the DevHarness, do not trigger the close/pop action.
          const isWithinApp = Dom.Event.isWithin(e, App.type);
          if (state && isWithinApp && isCenter && isTop) {
            props.onCloseRequest?.();
          }
        }}
      />
    </div>
  );
};
