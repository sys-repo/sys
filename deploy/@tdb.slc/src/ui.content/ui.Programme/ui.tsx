import React from 'react';
import { type t, App, Color, ConceptPlayer, css, Dom, Signal, useVideoPlayer } from './common.ts';
import { ProgrammeSignals } from './m.Signals.ts';
import { Calc } from './u.Calc.ts';
import { Menu } from './ui.Column.Menu.tsx';
import { Section } from './ui.Column.Section.tsx';
import { Main } from './ui.Main.tsx';
import { useController } from './use.Controller.ts';

type P = t.ProgrammeProps;

/**
 * Component:
 */
export const Programme: React.FC<P> = (props) => {
  const { content, isTop } = props;

  const stateRef = React.useRef(ProgrammeSignals.init(props));
  const state = stateRef.current;
  const player = useVideoPlayer(content.media, content.playOnLoad, props.muted);
  const video = player.signals;

  const p = state.props;
  const debug = p.debug.value;
  const align = p.align.value;
  const isCenter = align === 'Center';

  /**
   * Hooks:
   */
  const controller = useController({ state, video });

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => state.listen());
  React.useEffect(() => props.onReady?.({ content, state, video }), []);

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
      onSelect={(e) => controller.onSectionSelected(e.index)}
    />
  );

  const elSection = controller.section.media && (
    <Section
      debug={debug}
      state={state}
      content={content}
      video={player.signals}
      onSelect={(e) => controller.section.onChildSelected(e.index)}
    />
  );

  const elContentBody = controller.section.current && (
    <Main
      //
      debug={debug}
      state={state}
      content={content}
      player={player.signals}
    />
  );

  return (
    <div className={css(styles.base).class}>
      <ConceptPlayer
        debug={debug}
        theme={'Light'}
        // Column:
        columnAlign={align}
        columnVideo={player.signals}
        columnVideoVisible={!isCenter}
        columnBody={isCenter ? elRootMenu : elSection}
        // Content:
        contentTitle={wrangle.title(state)}
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

/**
 * Helpers:
 */
const wrangle = {
  title(state: t.ProgrammeSignals, options: { long?: boolean } = {}) {
    const { section, child } = Calc.Section.media(state);
    const UNTITLED = 'Untitled';
    if (!section) return UNTITLED;
    if (options.long ?? false) {
      return !child?.title ? section.title : `${section.title ?? UNTITLED}: ${child.title}`;
    } else {
      return section.title ?? UNTITLED;
    }
  },
} as const;
