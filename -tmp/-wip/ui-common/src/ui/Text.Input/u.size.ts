import { DEFAULTS, Measure, type t } from './common.ts';
import { CssUtil } from './u.css.ts';

export function measureInput(props: t.TextInputProps) {
  const { value, valueStyle = DEFAULTS.theme(props.theme) } = props;
  const style = CssUtil.toText(valueStyle);
  return Measure.size({ content: value, ...style });
}

export function measureText(props: t.TextProps) {
  const { children } = props;
  const style = { ...CssUtil.toText(props), ...props.style };
  return Measure.size({ content: children, ...style });
}

export async function toWidth(props: t.TextInputProps) {
  if (!props.autoSize) return props.width;

  const value = props.value;
  const maxWidth = props.maxWidth ?? -1;

  let width = (await measureInput(props)).width;
  width = value === undefined || value === '' ? await toMinWidth(props) : width;
  width = typeof maxWidth === 'number' && maxWidth !== -1 && width > maxWidth ? maxWidth : width;

  const charWidth = (await measureInput({ ...props, value: 'W' })).width;
  return width + charWidth; // NB: Adding an additional char-width prevents overflow jumping on char-enter.
}

export async function toMinWidth(props: t.TextInputProps): Promise<number> {
  const { minWidth, placeholder, value } = props;
  if (minWidth !== undefined) return minWidth as number;

  // NB: If min-width not specified, use placeholder width.
  if (!value && placeholder) {
    const style = CssUtil.toPlaceholder(props);
    const children = props.placeholder;
    const size = await measureText({ children, style });
    return size.width + 10;
  }

  return -1;
}
