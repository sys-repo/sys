import React from 'react';
import { type t, App, Color, ConceptPlayer, css, Dom, Signal } from './common.ts';
import { Menu } from './ui.Column.Menu.tsx';
import { Section } from './ui.Column.Section.tsx';
import { useProgrammeController } from './use.Programme.Controller.ts';

/**
 * Component:
 */
export const Programme: React.FC<t.ProgrammeProps> = (props) => {
  const { state, isTop } = props;

  const p = state.component?.props;
  const debug = p?.debug.value;
  const align = p?.align.value;
  const media = p?.media.value;
  const selectedMedia = media?.children?.[p?.section?.value?.index ?? -1];
  const title = selectedMedia?.title ?? 'Untitled';
  const isCenter = align === 'Center';

  const controller = useProgrammeController(state);

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => {
    state.component.listen();
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
    <Menu
      //
      media={media}
      debug={debug}
      onSelect={(e) => controller.onMenuSelect(e.index)}
    />
  );

  const elSection = selectedMedia && <Section media={selectedMedia} debug={debug} />;

  return (
    <div className={css(styles.base).class}>
      <ConceptPlayer
        debug={debug}
        theme={'Light'}
        columnAlign={align}
        columnVideo={selectedMedia?.video}
        columnBody={isCenter ? elRootMenu : elSection}
        contentTitle={title}
        onBackClick={() => controller.onBlackClick()}
        onClickOutsideColumn={(e) => {
          // NB: Only clicking outside the column, within the SLC app registeres.
          //     Wider contexts, like say the DevHarness, do not trigger the close/pop action.
          const isWithinApp = Dom.Event.isWithin(e, App.type);
          if (state && isWithinApp && isCenter && isTop) state.global.stack.pop();
        }}
      />
    </div>
  );
};
