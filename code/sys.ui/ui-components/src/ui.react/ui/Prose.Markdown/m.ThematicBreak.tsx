import { css, Num, type t } from './common.ts';

const TEXTURE = {
  '-': 'solid',
  '_': 'dashed',
  '*': 'dotted',
} as const;

const MIN_MARKERS = 3;
const MIN_THICKNESS = 1;
const MAX_THICKNESS = 10;
const FULL_OPACITY = 0.7;
const LIGHT_OPACITY = 0.4;

const source: t.ProseMarkdown.Block.ThematicBreak.Renderer = (props) => {
  if (!props.lexeme) return <hr />;

  const style = css({
    border: 0,
    borderTopColor: 'currentColor',
    borderTopStyle: TEXTURE[props.lexeme.marker],
    borderTopWidth: Num.clamp(
      MIN_THICKNESS,
      MAX_THICKNESS,
      props.lexeme.count - MIN_MARKERS + MIN_THICKNESS,
    ),
    opacity: props.lexeme.spaced ? LIGHT_OPACITY : FULL_OPACITY,
    height: 0,
    width: '100%',
  });
  return <hr className={style.class} />;
};

/**
 * Opt-in source-authored visual grammar for semantic Markdown thematic breaks.
 */
export const ThematicBreak: t.ProseMarkdown.Block.ThematicBreak.Lib = {
  source,
};
