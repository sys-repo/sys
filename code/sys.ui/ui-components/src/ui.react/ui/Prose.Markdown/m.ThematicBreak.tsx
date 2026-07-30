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

/**
 * Opt-in source-authored visual grammar for semantic Markdown thematic breaks.
 */
export const ThematicBreak: t.ProseMarkdown.Block.ThematicBreak.Lib = {
  source,
};

function source(args: t.ProseMarkdown.Block.ThematicBreak.RendererArgs): t.ReactNode {
  const { lexeme } = args;
  if (!lexeme) return <hr />;

  const style = css({
    border: 0,
    borderTopColor: 'currentColor',
    borderTopStyle: TEXTURE[lexeme.marker],
    borderTopWidth: Num.clamp(
      MIN_THICKNESS,
      MAX_THICKNESS,
      lexeme.count - MIN_MARKERS + MIN_THICKNESS,
    ),
    height: 0,
    opacity: lexeme.spaced ? LIGHT_OPACITY : FULL_OPACITY,
    width: '100%',
  });
  return <hr className={style.class} />;
}
