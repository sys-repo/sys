import { css, Is, Obj, Style, type t } from './common.ts';

type Input = t.FocusStyle.Input & { via?: `--${string}` };

const animationVar = '--sys-focus-animation';
// Backwards fill shows arrival during the hold; name last keeps preference-mode `none` unambiguous.
const animation = `220ms ease-out 70ms 1 normal backwards running var(${animationVar})`;

/**
 * One focus-arrival policy, composed at the final paint target.
 */
export const FocusStyle: t.FocusStyle.Lib = { compose };

/**
 * Helpers:
 */
function compose(input: t.FocusStyle.Input & { via: `--${string}` }): t.FocusStyle.Child;
function compose(input: t.FocusStyle.Input): t.FocusStyle.Target;
function compose(input: Input): t.FocusStyle.Target | t.FocusStyle.Child {
  const { base, style, paint, via } = input;
  const caller: t.Style.Value = css(style).style;
  if (!via && Obj.hasOwn(caller, ':focus-visible')) return { class: css(base, style).class };

  const animationProperty = /^(?:animation|WebkitAnimation|MozAnimation|msAnimation|OAnimation)/;
  const ownsAnimation = Obj.keys(caller).some((key) => {
    return animationProperty.test(key) && !Is.nil(caller[key]);
  });
  const recipe = toPaint(paint);
  const active = { ...paint.settled, animation: ownsAnimation ? undefined : animation };
  const root = css(
    base,
    paint.defaults,
    recipe.variables,
    { [animationVar]: via ? `var(${via}, none)` : recipe.name },
    via ? { ...active, opacity: `var(${via}-visible, 0)` } : { ':focus-visible': active },
    style,
  );

  // Preserve the original input: template normalization can otherwise erase an explicit clear.
  if (!via && !Obj.hasOwn(root.style, ':focus-visible')) return { class: css(base, style).class };

  const target = { class: root.class };
  const selector = `.${target.class}`;
  const sheet = Style.Dom.stylesheet();
  if (recipe.name !== 'none') {
    // From-only frames settle to ordinary declarations, never a forwards-filled appearance.
    sheet.rule('from', recipe.from, { context: `@keyframes ${recipe.name}` });
  }
  sheet.rule(selector, { [animationVar]: 'none' }, {
    context: '@media (prefers-reduced-motion: reduce)',
  });
  sheet.rule(selector, { [animationVar]: 'none' }, {
    context: '@media (forced-colors: active)',
  });
  sheet.rule(via ? selector : `${selector}:focus-visible`, recipe.forced, {
    context: '@media (forced-colors: active)',
  });

  if (!via) return target;
  const visible: `--${string}` = `${via}-visible`;
  const inactive: t.Style.Props = { [via]: 'none', [visible]: 0 };
  const focused: t.Style.Props = { [via]: recipe.name, [visible]: 1 };
  return { ...target, activation: { ...inactive, ':focus-visible': focused } };
}

/** Separate stable paint structure from target-local values, including preference-only paint. */
function toPaint(paint: t.FocusStyle.Paint) {
  const arrival = [['outlineColor', 'outline'], ['boxShadow', 'shadow']] as const;
  const forcedColors = [
    ['outline', 'outline'],
    ['outlineOffset', 'offset'],
    ['boxShadow', 'shadow'],
  ] as const;
  const variables: t.Style.Props = {};
  const from: t.Style.Props = {};
  const forced: t.Style.Props = {};
  const parts: string[] = [];
  for (const [key, part] of arrival) {
    const value = paint.arrival[key];
    if (Is.nil(value)) continue;
    const variable: `--${string}` = `--sys-focus-arrival-${part}`;
    variables[variable] = value;
    from[key] = `var(${variable})`;
    parts.push(part);
  }
  for (const [key, part] of forcedColors) {
    const value = paint.forcedColors[key];
    if (Is.nil(value)) continue;
    const variable: `--${string}` = `--sys-focus-forced-${part}`;
    // Custom properties are unitless in ui-css; this one represents an outline-offset length.
    variables[variable] = key === 'outlineOffset' && Is.number(value) ? `${value}px` : value;
    forced[key] = `var(${variable})`;
  }
  const name = parts.length ? `sys-focus-arrival-${parts.join('-')}` : 'none';
  return { variables, from, forced, name };
}
