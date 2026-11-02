import { Color, css, D, Is, Obj, Style, type t } from './common.ts';

const prefix = `sys-${D.name.toLowerCase()}-focus`;
const keyframeName = `${prefix}-arrival`;
const accentVar = `--${prefix}-accent` as const;
const restVar = `--${prefix}-rest` as const;
const widthVar = `--${prefix}-width` as const;
const offsetVar = `--${prefix}-offset` as const;
const animationVar = `--${prefix}-animation` as const;
const restingColor = Color.alpha(Color.BLUE, 0.2);

/** Compose and register default focus; a caller focus block replaces the entire treatment. */
export function focusStyle(base: t.CssInput, input?: t.CssInput) {
  const caller: t.CssValue = css(input).style;
  if (Obj.hasOwn(caller, ':focus-visible')) return css(base, input);

  const ownsAnimation = Obj.keys(caller).some((key) =>
    /^(?:animation|WebkitAnimation|MozAnimation|msAnimation|OAnimation)/.test(key) &&
    !Is.nil(caller[key])
  );
  const root = css(
    base,
    {
      [accentVar]: Color.BLUE,
      [restVar]: restingColor,
      [widthVar]: '2px',
      [offsetVar]: '2px',
      [animationVar]: keyframeName,
    },
    {
      ':focus-visible': {
        outline: `var(${widthVar}) solid var(${restVar})`,
        outlineOffset: `var(${offsetVar})`,
        // Backwards fill holds the accent; name last keeps `none` unambiguous in preference modes.
        animation: ownsAnimation
          ? undefined
          : `220ms ease-out 70ms 1 normal backwards running var(${animationVar})`,
      },
    },
    input,
  );

  // Merge original input before templates: normalization can erase an explicit focus clear.
  if (!Obj.hasOwn(root.style, ':focus-visible')) return css(base, input);

  const sheet = Style.Dom.stylesheet();
  // One from-only keyframe settles to the ordinary outline colour, without forwards fill.
  sheet.rule('from', { outlineColor: `var(${accentVar})` }, {
    context: `@keyframes ${keyframeName}`,
  });

  // Register after the final root class so preference policy wins over its palette.
  const selector = `.${root.class}`;
  sheet.rule(selector, { [animationVar]: 'none' }, {
    context: '@media (prefers-reduced-motion: reduce)',
  });
  sheet.rule(selector, { [animationVar]: 'none', [restVar]: 'Highlight' }, {
    context: '@media (forced-colors: active)',
  });
  return root;
}
