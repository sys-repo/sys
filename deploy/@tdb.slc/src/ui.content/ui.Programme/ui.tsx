import React from 'react';
import { type t, App, Color, ConceptPlayer, css, Dom, Signal } from './common.ts';
import { Menu } from './ui.Column.Menu.tsx';
import { Section } from './ui.Column.Section.tsx';
import { useProgrammeController } from './use.Programme.Controller.ts';

/**
 * Component:
 */
export const ProgrammeRoot: React.FC<t.ProgrammeRootProps> = (props) => {
  const { content, state, isTop } = props;
  const p = state.component?.props;

  const debug = p?.debug.value;
  const align = p?.align.value;
  const media = p?.media.value;

  const isCenter = align === 'Center';
  const title = media?.title ?? 'Untitled';

  useProgrammeController(content, state);

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
      content={content}
      debug={debug}
      onSelect={(e) => {
        if (p) {
          p.align.value = 'Right';
          p.media.value = e.item;
        }
      }}
    />
  );

  const elSection = media && <Section media={media} debug={debug} />;

  return (
    <div className={css(styles.base).class}>
      <ConceptPlayer
        debug={debug}
        theme={'Light'}
        columnAlign={align}
        columnVideo={content.media?.video}
        columnBody={isCenter ? elRootMenu : elSection}
        contentTitle={title}
        onBackClick={() => {
          if (p) {
            p.align.value = 'Center';
            p.media.value = undefined;
          }
        }}
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
