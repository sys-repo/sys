import React from 'react';
import { type t, App, Color, ConceptPlayer, css, Dom, Signal } from './common.ts';
import { Menu } from './ui.Column.Menu.tsx';
import { Section } from './ui.Column.Section.tsx';
import { Main } from './ui.Main.tsx';
import { useProgrammeController } from './use.Programme.Controller.ts';

/**
 * Component:
 */
export const Programme: React.FC<t.ProgrammeProps> = (props) => {
  const { state, isTop } = props;

  const p = state.props;
  const debug = p.debug.value;
  const align = p.align.value;
  const isCenter = align === 'Center';

  /**
   * Hooks:
   */
  const controller = useProgrammeController(state);

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => state.listen());

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
      debug={debug}
      media={controller.media}
      onSelect={(e) => controller.onSelectSection(e.index)}
    />
  );

  const elSection = controller.section.media && (
    <Section
      debug={debug}
      media={controller.section.media.section}
      selected={controller.section.index.child}
      onSelect={(e) => controller.section.onSelectChild(e.index)}
    />
  );

  const elContentBody = controller.section.media && (
    <Main
      debug={debug}
      media={controller.section.media.section}
      selected={controller.section.index.child}
    />
  );

  return (
    <div className={css(styles.base).class}>
      <ConceptPlayer
        debug={debug}
        theme={'Light'}
        // Column:
        columnAlign={align}
        columnVideo={controller.section.player}
        columnVideoVisible={!isCenter}
        columnBody={isCenter ? elRootMenu : elSection}
        // Content:
        contentTitle={controller.section.title}
        contentBody={elContentBody}
        // Event handlers:
        onBackClick={() => controller.onBackClick()}
        onClickOutsideColumn={(e) => {
          // NB: Only clicking outside the column but within the SLC app.
          //     Wider contexts, like say the DevHarness, do not trigger the close/pop action.
          const isWithinApp = Dom.Event.isWithin(e, App.type);
          if (isWithinApp && isCenter && isTop) props.onCloseRequest?.();
        }}
      />
    </div>
  );
};
