import { compose, FocusStyle } from '../../../m.style/m.FocusStyle/m.FocusStyle.ts';
import { css, Is, Obj, Style, type t } from './common.ts';

const outline = FocusStyle.outline('--sys-button-focus');

// The root still animates the outline colour; only the out-of-flow box draws its stroke.
const accentPaint = {
  ...outline.paint,
  defaults: { ...outline.paint.defaults, '--sys-button-focus-offset': '0.1em' },
  settled: { ...outline.paint.settled, outline: '0px solid var(--sys-button-focus-rest)' },
};

export function focusStyle(base: t.CssInput, style?: t.CssInput, tone?: t.Button.Props['tone']) {
  const compact = tone === 'accent' && !ownsPaintBox(css(style).style);
  const paint = compact ? accentPaint : outline.paint;
  return compose(
    { base: [outline.base, base], style, paint },
    compact ? registerCompact : undefined,
  );
}

/** A caller can change the root's paint box even while keyboard focus remains on it. */
function ownsPaintBox(style: t.Style.Value): boolean {
  const geometry =
    /^(?:all|position|display|overflow(?:X|Y|Block|Inline)?|contain|contentVisibility)$/;
  return Obj.keys(style).some((key) => {
    if (Style.Dom.PseudoClass.isClass(key)) {
      const state = style[key];
      return !Is.nil(state) && ownsPaintBox(state);
    }
    return geometry.test(key) && !Is.nil(style[key]);
  });
}

function registerCompact(focus: string) {
  const selector = `${focus}::after`;
  const sheet = Style.Dom.stylesheet();
  sheet.rule(selector, {
    content: '""',
    position: 'absolute',
    inset: 0,
    // Trim half the excess leading on each edge, not padding or additional lines.
    insetBlock: 'max(0px, (1lh - 1em) / 2)',
    insetInline: '-0.1875em',
    pointerEvents: 'none',
    borderRadius: 'inherit',
    outlineStyle: 'solid',
    outlineWidth: 'var(--sys-button-focus-width)',
    outlineColor: 'inherit',
    outlineOffset: 'inherit',
  });
  // Forced colours always use the system-colour outline on the focusable root.
  sheet.rule(selector, { content: 'none' }, { context: '@media (forced-colors: active)' });
}
