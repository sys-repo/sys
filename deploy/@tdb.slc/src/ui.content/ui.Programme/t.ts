import { type t } from './common.ts';

/**
 * Programm content definition.
 */
export type ProgrammeContent = t.VideoContent & { state: ProgrammeSignals };

/**
 * <Component> Signal State:
 */
export type ProgrammeSignals = {
  listen(): void;
  props: {
    debug: t.Signal<boolean>;
    align: t.Signal<t.ConceptPlayerAlign>;
    media: t.Signal<t.VideoMediaContent | undefined>;
    section: t.Signal<t.ProgrammeSignalsSelectedSection | undefined>;
  };
};
/** SelectedSection */
export type ProgrammeSignalsSelectedSection = { index: t.Index; childIndex?: t.Index };

/**
 * <Commponent>: Root.
 */
export type ProgrammeProps = {
  state: t.ProgrammeSignals;
  content: t.ProgrammeContent;
  player?: t.VideoPlayerSignals;
  isTop?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onCloseRequest?: () => void;
  onReady?: (e: {
    state: t.ProgrammeSignals;
    content: t.ProgrammeContent;
    player: t.VideoPlayerSignals;
  }) => void;
};

/**
 * <Component>: Section
 */
export type ProgrammeSectionProps = {
  state: t.ProgrammeSignals;
  content: t.ProgrammeContent;
  player: t.VideoPlayerSignals;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSelect?: (e: { index: t.Index }) => void;
};

/**
 * <Component>: Main
 */
export type ProgrammeMainProps = {
  state: t.ProgrammeSignals;
  content: t.ProgrammeContent;
  player: t.VideoPlayerSignals;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
