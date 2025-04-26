import { type t } from './common.ts';

export type ProgrammeContent = t.VideoContent & {
  state: ProgrammeSignals;
};

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
export type ProgrammeSignalsSelectedSection = { index: t.Index };

/**
 * <Commponent>: Root.
 */
export type ProgrammeState = { global: t.AppSignals; component: t.ProgrammeSignals };
export type ProgrammeProps = {
  state: t.ProgrammeState;
  isTop?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * <Component>: Section
 */
export type ProgrammeSectionProps = {
  media?: t.VideoMediaContent;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
