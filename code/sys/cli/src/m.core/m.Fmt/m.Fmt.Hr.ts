import { type t, Color, Is } from '../common.ts';

const HR_CHAR = '━';
const HR_DEFAULT_WIDTH = 84;

export const hr: t.CliFormatLib['hr'] = (first?: number | t.CliFormatHrColor, second?: t.CliFormatHrColor) => {
  const width = Is.number(first) ? first : HR_DEFAULT_WIDTH;
  const color = Is.number(first) ? second : first;
  const line = HR_CHAR.repeat(width);

  return color ? Color.foreground[color](line) : line;
};
