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
  isTop?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onCloseRequest?: () => void;
};

/**
 * <Component>: Section
 */
export type ProgrammeSectionProps = {
  debug?: boolean;
  state: t.ProgrammeSignals;
  content: t.ProgrammeContent;

  selected?: t.Index;
  media?: t.VideoMediaContent;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSelect?: (e: { index: t.Index }) => void;
};

/**
 * <Component>: Main
 */
export type ProgrammeMainProps = {
  debug?: boolean;
  state: t.ProgrammeSignals;
  content: t.ProgrammeContent;

  selected?: t.Index;
  media?: t.VideoMediaContent;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
