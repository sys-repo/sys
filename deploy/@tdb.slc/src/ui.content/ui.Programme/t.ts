import { type t } from './common.ts';

/**
 * <Component> Signal State:
 */
export type ProgrammeSignals = {
  props: {
    debug: t.Signal<boolean>;
    align: t.Signal<t.ConceptPlayerAlign>;
    media: t.Signal<t.VideoMediaContent | undefined>;
  };
  listen(): void;
};

/**
 * <Commponent>
 */
export type ProgrammeRootProps = {
  state: { global: t.AppSignals; component: t.ProgrammeSignals };
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
