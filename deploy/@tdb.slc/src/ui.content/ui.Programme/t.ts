import { type t } from './common.ts';

/**
 * <Component> Signal State:
 */
export type ProgrammeSignals = {
  listen(): void;
  props: {
    debug: t.Signal<boolean>;
    align: t.Signal<t.ConceptPlayerAlign>;
    media: t.Signal<t.VideoMediaContent | undefined>;
  };
};

export type ProgrammeState = { global: t.AppSignals; component: t.ProgrammeSignals };

/**
 * <Commponent>: Root.
 */
export type ProgrammeRootProps = {
  state: t.ProgrammeState;
  content: t.VideoContent;
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
