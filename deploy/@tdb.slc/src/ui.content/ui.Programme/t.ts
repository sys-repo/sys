import { type t } from './common.ts';

/**
 * Programm content definition.
 */
export type ProgrammeContent = t.VideoContent;

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
  content: t.ProgrammeContent;
  state?: t.ProgrammeSignals;
  player?: t.VideoPlayerSignals;
  isTop?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onCloseRequest?: () => void;
  onReady?: t.ProgrammeReadyHandler;
};

/** Event: Fires when the "Programme" becomes ready. */
export type ProgrammeReadyHandler = (e: ProgrammeReadyHandlerArgs) => void;
export type ProgrammeReadyHandlerArgs = {
  content: t.ProgrammeContent;
  state: t.ProgrammeSignals;
  player: t.VideoPlayerSignals;
};

/**
 * <Component>: Section
 */
export type ProgrammeSectionProps = {
  content: t.ProgrammeContent;
  state: t.ProgrammeSignals;
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
  content: t.ProgrammeContent;
  state: t.ProgrammeSignals;
  player: t.VideoPlayerSignals;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
