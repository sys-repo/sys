import { Style, type t } from './common.ts';
import { compose } from './m.FocusStyle.ts';
import { outline } from './u.outline.ts';

export const focusInk = {
  attribute: 'data-sys-focus-ink',
  anchor: '--sys-focused-control',
} as const;

/** The root owns native focus. Its optional, out-of-flow decoration owns no caller layout. */
export function controlFocus(
  prefix: `--${string}`,
  underline?: Pick<t.CssValue, 'textDecoration'>,
) {
  const { paint } = outline(prefix);
  const control = {
    ...paint,
    defaults: { ...paint.defaults, [`${prefix}-offset`]: '0.1em' },
    settled: { ...paint.settled, ...underline },
  };
  return (base: t.CssInput, style?: t.CssInput) => {
    let compact = false;
    const target = compose(
      { base: [{ borderRadius: 3 }, base], style, paint: control },
      (focus) => {
        registerBox(focus, prefix, !!underline);
        compact = true;
      },
    );
    return { ...target, compact };
  };
}

function registerBox(focus: string, prefix: `--${string}`, underlined: boolean) {
  const sheet = Style.Dom.stylesheet();
  const media = { context: '@media (forced-colors: none)' };
  const ink = `[${focusInk.attribute}]`;
  const box = `${focus}:has(> ${ink})`;
  const trim = 'max(0px, (var(--sys-focus-line-box, 1lh) - 1em) / 2)';
  sheet.rule(`:where(${box})`, { anchorName: focusInk.anchor }, media);
  sheet.rule(box, { outlineWidth: 0 }, media);
  sheet.rule(`${focus} > ${ink}`, {
    display: 'block',
    position: 'absolute',
    positionAnchor: focusInk.anchor,
    // When the control is itself the containing block, its edges are the zero-inset fallback.
    insetInline: 'calc(anchor(start, 0px) - 0.1875em) calc(anchor(end, 0px) - 0.1875em)',
    insetBlockStart: `calc(anchor(start, 0px) + ${trim})`,
    insetBlockEnd: `calc(anchor(end, 0px) + ${trim} - ${underlined ? 2 : 0}px)`,
    pointerEvents: 'none',
    borderRadius: 'inherit',
    outlineStyle: 'solid',
    outlineWidth: `var(${prefix}-width)`,
    outlineColor: 'inherit',
    outlineOffset: 'inherit',
  }, media);
  sheet.rule(`${focus} > [${focusInk.attribute}="inline"]`, {
    '--sys-focus-line-box': 'anchor-size(block, 100%)',
  }, media);
}
